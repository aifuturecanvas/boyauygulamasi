import {
  Feather,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import * as FileSystem from "expo-file-system";

import { initDb, insertImage, updateImageRecord, uid } from "../utils/db";
import { saveBase64PNGToGallery } from "../utils/gallery";

// Çocuk dostu yatay renk paleti
const COLORS = [
  "#FF6B6B",
  "#FFD93D",
  "#6BCB77",
  "#4D96FF",
  "#845EC2",
  "#FF9671",
  "#FFC75F",
  "#F9F871",
  "#FF6F91",
  "#00C9A7",
  "#A52A2A",
  "#8D5524",
  "#000000",
  "#78716C",
  "#FFFFFF",
];

const BRUSH_SIZES = { small: 5, medium: 15, large: 30 };

const ColoringScreen = ({ route, navigation }) => {
  const { image } = route.params;
  const webViewRef = useRef(null);

  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [isWebViewReady, setIsWebViewReady] = useState(false);
  const [activeTool, setActiveTool] = useState("fill"); // 'fill' | 'brush' | 'eraser'
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES.medium);

  useEffect(() => {
    initDb();
  }, []);

  const htmlContent = useMemo(
    () => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
    <style>
      html,body{margin:0;padding:0;background:#E5E7EB;overflow:hidden;touch-action:none;-webkit-user-select:none;user-select:none;}
      #canvas-container{position:relative;width:100vw;height:100vh;display:flex;justify-content:center;align-items:center;}
      canvas{display:block}
    </style>
  </head>
  <body>
    <div id="canvas-container">
      <canvas id="visibleCanvas"></canvas>
    </div>
    <script>
      const visibleCanvas = document.getElementById('visibleCanvas');
      const vCtx = visibleCanvas.getContext('2d', { alpha: false });

      // Katmanlar
      const colorCanvas = document.createElement('canvas');
      const cCtx = colorCanvas.getContext('2d', { willReadFrequently: true });
      const outlineCanvas = document.createElement('canvas');
      const oCtx = outlineCanvas.getContext('2d', { willReadFrequently: true });

      // Outline bariyer maskesi: 1 = çizgi (geçilmez), 0 = boşluk
      let outlineBarrier = null; // Uint8Array

      let currentColor = hexToRgba('${COLORS[0]}');
      let currentTool = 'fill';
      let isDrawing = false;
      let currentBrushSize = ${BRUSH_SIZES.medium};

      // Pan/zoom
      let transform = { scale: 1, panX: 0, panY: 0 };
      let initialTransform = { scale: 1, panX: 0, panY: 0 };
      let isPanning = false, isPinching = false;
      let lastPanPoint = { x: 0, y: 0 };
      let lastPinchDistance = 0;
      let lastPinchCenter = { x: 0, y: 0 }; // ✨ eklendi
      let lastPoint = { x: 0, y: 0 };
      let touchMoved = false;

      // Undo/redo yalnızca colorCanvas için
      let history = [];
      let historyIndex = -1;

      // redraw throttling
      let redrawScheduled = false;
      function scheduleRedraw(){
        if(redrawScheduled) return;
        redrawScheduled = true;
        requestAnimationFrame(() => {
          redrawVisibleCanvas();
          redrawScheduled = false;
        });
      }

      function saveState() {
        if (historyIndex < history.length - 1) history.splice(historyIndex + 1);
        if (history.length >= 20) history.shift();
        history.push(cCtx.getImageData(0, 0, colorCanvas.width, colorCanvas.height));
        historyIndex = history.length - 1;
      }
      function undo(){
        if(historyIndex > 0){
          historyIndex--;
          cCtx.putImageData(history[historyIndex], 0, 0);
          scheduleRedraw();
        }
      }
      function redo(){
        if(historyIndex < history.length - 1){
          historyIndex++;
          cCtx.putImageData(history[historyIndex], 0, 0);
          scheduleRedraw();
        }
      }

      function hexToRgba(hex){
        const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
        return [r,g,b,255];
      }
      function colorEq(c1, c2, tol=16){
        return Math.abs(c1[0]-c2[0])<tol && Math.abs(c1[1]-c2[1])<tol && Math.abs(c1[2]-c2[2])<tol && Math.abs(c1[3]-c2[3])<tol;
      }

      // Outline ve bariyer: TEK PASS
      // Outline ve bariyer: SADECE yakın-siyah pikseller çizgi kabul edilir
        function processOutlineAndBarrierFrom(imgData){
        const { width, height, data } = imgData;

        // Yakın-siyah tespiti (eşik ayarı)
        const isNearBlack = (r,g,b) => {
            const T = 70; // 70–100 arası deneyebilirsin
            return r < T && g < T && b < T;
        };

        // 1) Bariyer maskesi (yalnızca siyah çizgiler)
        let barrier = new Uint8Array(width * height);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const r = data[i], g = data[i+1], b = data[i+2];
            barrier[y * width + x] = isNearBlack(r,g,b) ? 1 : 0;
            }
        }

        // 2) 1 piksel genişletme (taşmayı azaltır)
        const dilated = new Uint8Array(width * height);
        const neigh = [-1, 0, 1];
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
            const p = y * width + x;
            if (barrier[p] === 1) {
                dilated[p] = 1;
                for (let dy of neigh) for (let dx of neigh) {
                const nx = x + dx, ny = y + dy;
                if (nx>=0 && nx<width && ny>=0 && ny<height) {
                    dilated[ny * width + nx] = 1;
                }
                }
            }
            }
        }
        outlineBarrier = dilated;

        // 3) Görsel outline katmanı: çizgi = siyah opak, diğer her yer = tam şeffaf
        const lineData = new Uint8ClampedArray(width * height * 4);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
            const p = y * width + x;
            const i = p * 4;
            if (outlineBarrier[p] === 1) {
                lineData[i]=0; lineData[i+1]=0; lineData[i+2]=0; lineData[i+3]=255;
            } else {
                lineData[i]=0; lineData[i+1]=0; lineData[i+2]=0; lineData[i+3]=0;
            }
            }
        }
        const outImg = new ImageData(lineData, width, height);
        oCtx.clearRect(0,0,width,height);
        oCtx.putImageData(outImg, 0, 0);
        }


      // Flood Fill (çizgileri geçmez, scanline)
      function floodFill(x, y, fillColor){
        const { width, height } = colorCanvas;
        if(x<0||x>=width||y<0||y>=height) return;
        if(outlineBarrier[(y*width)+x] === 1) return;

        const img = cCtx.getImageData(0,0,width,height);
        const data = img.data;

        const idx = (y*width + x) * 4;
        const start = [data[idx], data[idx+1], data[idx+2], data[idx+3]];
        if(colorEq(start, fillColor)) return;

        const stack = [[x,y]];
        while(stack.length){
          const [sx, sy] = stack.pop();
          let nx = sx;
          // sola kaydır
          while(nx>=0 && outlineBarrier[(sy*width)+nx]===0 && colorsEqAt(data, nx, sy, start, width)) nx--;
          nx++;
          let spanUp=false, spanDown=false;
          while(nx<width && outlineBarrier[(sy*width)+nx]===0 && colorsEqAt(data, nx, sy, start, width)){
            const o = (sy*width + nx)*4;
            data[o]=fillColor[0]; data[o+1]=fillColor[1]; data[o+2]=fillColor[2]; data[o+3]=fillColor[3];

            if(sy>0){
              if(!spanUp && outlineBarrier[((sy-1)*width)+nx]===0 && colorsEqAt(data, nx, sy-1, start, width)){
                stack.push([nx, sy-1]); spanUp=true;
              } else if(spanUp && (outlineBarrier[((sy-1)*width)+nx]===1 || !colorsEqAt(data, nx, sy-1, start, width))){
                spanUp=false;
              }
            }
            if(sy<height-1){
              if(!spanDown && outlineBarrier[((sy+1)*width)+nx]===0 && colorsEqAt(data, nx, sy+1, start, width)){
                stack.push([nx, sy+1]); spanDown=true;
              } else if(spanDown && (outlineBarrier[((sy+1)*width)+nx]===1 || !colorsEqAt(data, nx, sy+1, start, width))){
                spanDown=false;
              }
            }
            nx++;
          }
        }
        cCtx.putImageData(img,0,0);
      }
      function colorsEqAt(data, x, y, target, width, tol=16){
        const o=(y*width + x)*4;
        return Math.abs(data[o]-target[0])<tol &&
               Math.abs(data[o+1]-target[1])<tol &&
               Math.abs(data[o+2]-target[2])<tol &&
               Math.abs(data[o+3]-target[3])<tol;
      }

      function getCanvasPoint(clientX, clientY){
        const rect = visibleCanvas.getBoundingClientRect();
        return {
          x: (clientX - rect.left - transform.panX) / transform.scale,
          y: (clientY - rect.top - transform.panY) / transform.scale
        };
      }

      function redrawVisibleCanvas(){
        vCtx.save();
        vCtx.setTransform(1,0,0,1,0,0);
        vCtx.clearRect(0,0,visibleCanvas.width, visibleCanvas.height);
        vCtx.translate(transform.panX, transform.panY);
        vCtx.scale(transform.scale, transform.scale);
        vCtx.imageSmoothingEnabled = false;
        vCtx.drawImage(colorCanvas, 0, 0);   // önce renk
        vCtx.drawImage(outlineCanvas, 0, 0); // sonra şeffaf outline
        vCtx.restore();
      }

      function startDrawing(e){
        const p = getCanvasPoint(e.touches[0].clientX, e.touches[0].clientY);
        lastPoint = { x: p.x, y: p.y };
      }

      function draw(e){
        const p = getCanvasPoint(e.touches[0].clientX, e.touches[0].clientY);

        if(currentTool === 'eraser'){
          // Bresenham: kare kare beyaz doldur (sadece colorCanvas)
          let x1 = Math.floor(lastPoint.x), y1 = Math.floor(lastPoint.y);
          const x2 = Math.floor(p.x), y2 = Math.floor(p.y);
          const dx = Math.abs(x2-x1), dy = Math.abs(y2-y1);
          const sx = x1 < x2 ? 1 : -1;
          const sy = y1 < y2 ? 1 : -1;
          let err = dx - dy;

          cCtx.fillStyle = '#FFFFFF';
          while(true){
            cCtx.fillRect(x1 - currentBrushSize/2, y1 - currentBrushSize/2, currentBrushSize, currentBrushSize);
            if(x1===x2 && y1===y2) break;
            const e2 = 2*err;
            if(e2 > -dy){ err -= dy; x1 += sx; }
            if(e2 < dx){ err += dx; y1 += sy; }
          }
        }else{ // brush
          cCtx.beginPath();
          cCtx.moveTo(lastPoint.x, lastPoint.y);
          cCtx.lineTo(p.x, p.y);
          cCtx.strokeStyle = \`rgb(\${currentColor[0]},\${currentColor[1]},\${currentColor[2]})\`;
          cCtx.lineWidth = currentBrushSize;
          cCtx.lineCap = 'round';
          cCtx.lineJoin = 'round';
          cCtx.stroke();
        }
        lastPoint = { x: p.x, y: p.y };
        scheduleRedraw();
      }

      // Dokunma olayları (iOS için passive:false)
      visibleCanvas.addEventListener('touchstart', (e)=>{
        e.preventDefault();
        touchMoved=false;
        if(e.touches.length===1){
          if(currentTool==='brush' || currentTool==='eraser'){
            isDrawing=true; isPanning=false; startDrawing(e);
          }else{ // fill/pan
            lastPanPoint = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          }
        }else if(e.touches.length>=2){
          isPinching=true; isDrawing=false; isPanning=false;
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          lastPinchDistance = Math.hypot(dx,dy);
          // ✨ iki parmak merkezini kaydet
          lastPinchCenter = {
            x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
            y: (e.touches[0].clientY + e.touches[1].clientY) / 2
          };
        }
      }, { passive:false });

      visibleCanvas.addEventListener('touchmove', (e)=>{
        e.preventDefault();
        touchMoved=true;
        if(isPinching && e.touches.length>=2){
          const p1 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          const p2 = { x: e.touches[1].clientX, y: e.touches[1].clientY };
          const dx = p1.x - p2.x, dy = p1.y - p2.y;
          const pinchDistance = Math.hypot(dx,dy);

          // ✨ anlık merkez (ekran coords)
          const cx = (p1.x + p2.x) / 2;
          const cy = (p1.y + p2.y) / 2;

          if(lastPinchDistance>0){
            const scaleFactor = pinchDistance / lastPinchDistance;

            // ✨ 1) Merkez hareketini pan'a uygula (ölçek değişmese de iki parmakla pan çalışır)
            transform.panX += (cx - lastPinchCenter.x);
            transform.panY += (cy - lastPinchCenter.y);

            // 2) Mevcut davranış: merkez etrafında zoom
            const newScale = Math.max(0.5, Math.min(transform.scale * scaleFactor, 5));
            transform.panX = cx + (transform.panX - cx) * scaleFactor;
            transform.panY = cy + (transform.panY - cy) * scaleFactor;
            transform.scale = newScale;
          }

          // ölçümleri güncelle
          lastPinchDistance = pinchDistance;
          lastPinchCenter = { x: cx, y: cy };

          scheduleRedraw();
        }else if(isDrawing && e.touches.length===1){
          draw(e);
        }else if(!isDrawing && !isPinching && e.touches.length===1){
          isPanning=true;
          const dx = e.touches[0].clientX - lastPanPoint.x;
          const dy = e.touches[0].clientY - lastPanPoint.y;
          transform.panX += dx; transform.panY += dy;
          lastPanPoint = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          scheduleRedraw();
        }
      }, { passive:false });

      visibleCanvas.addEventListener('touchend', (e)=>{
        if(currentTool==='fill' && !touchMoved && e.changedTouches.length===1){
          const p = getCanvasPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
          floodFill(Math.floor(p.x), Math.floor(p.y), currentColor);
          saveState();
          scheduleRedraw();
        }
        if(isDrawing) saveState();
        isDrawing=false; isPanning=false; isPinching=false;
      }, { passive:false });

      // RN mesajları
      window.addEventListener('message', (event)=>{
        try{
          const msg = JSON.parse(event.data);
          switch(msg.type){
            case 'SET_IMAGE': {
              const img = new Image();
              img.crossOrigin = 'Anonymous';
              img.onload = ()=>{
                const container = document.getElementById('canvas-container');
                const cw = container.clientWidth, ch = container.clientHeight;

                visibleCanvas.width = cw; visibleCanvas.height = ch;
                outlineCanvas.width = img.naturalWidth; outlineCanvas.height = img.naturalHeight;
                colorCanvas.width = img.naturalWidth; colorCanvas.height = img.naturalHeight;

                // Ana hatları çiz
                oCtx.clearRect(0,0,outlineCanvas.width, outlineCanvas.height);
                oCtx.drawImage(img, 0, 0);

                // 1) Mevcut piksel verisinden bariyer + şeffaf outline üret
                const raw = oCtx.getImageData(0,0,outlineCanvas.width, outlineCanvas.height);
                processOutlineAndBarrierFrom(raw);

                // 2) Boyama katmanını beyazla başlat
                cCtx.fillStyle = '#FFFFFF';
                cCtx.fillRect(0,0,colorCanvas.width, colorCanvas.height);

                // 3) Görünür tuvali resme sığdır
                const scaleToFit = Math.min(cw/img.naturalWidth, ch/img.naturalHeight);
                const initialPanX = (cw - img.naturalWidth * scaleToFit) / 2;
                const initialPanY = (ch - img.naturalHeight * scaleToFit) / 2;
                initialTransform = { scale: scaleToFit, panX: initialPanX, panY: initialPanY };
                transform = { ...initialTransform };

                // Başlangıç state
                history = []; historyIndex = -1; saveState();
                scheduleRedraw();
              };
              img.src = msg.payload;
              break;
            }
            case 'LOAD_SAVED_IMAGE': {
              const img = new Image();
              img.crossOrigin = 'Anonymous';
              img.onload = () => {
                const container = document.getElementById('canvas-container');
                const cw = container.clientWidth, ch = container.clientHeight;

                visibleCanvas.width = cw; visibleCanvas.height = ch;
                outlineCanvas.width = img.naturalWidth; outlineCanvas.height = img.naturalHeight;
                colorCanvas.width = img.naturalWidth; colorCanvas.height = img.naturalHeight;

                // 1) Kaydedilmiş (renkli) resmi doğrudan renk katmanına çiz
                cCtx.clearRect(0, 0, colorCanvas.width, colorCanvas.height);
                cCtx.drawImage(img, 0, 0);

                // 2) Aynı resmi kullanarak ana hatları ve bariyerleri yeniden oluştur
                oCtx.clearRect(0, 0, outlineCanvas.width, outlineCanvas.height);
                oCtx.drawImage(img, 0, 0);
                const raw = oCtx.getImageData(0, 0, outlineCanvas.width, outlineCanvas.height);
                processOutlineAndBarrierFrom(raw); 

                // 3) Ekrana sığdır
                const scaleToFit = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
                const initialPanX = (cw - img.naturalWidth * scaleToFit) / 2;
                const initialPanY = (ch - img.naturalHeight * scaleToFit) / 2;
                initialTransform = { scale: scaleToFit, panX: initialPanX, panY: initialPanY };
                transform = { ...initialTransform };

                history = []; historyIndex = -1; saveState();
                scheduleRedraw();
              };
              img.src = msg.payload;
              break;
            }
            case 'SET_COLOR': currentColor = hexToRgba(msg.payload); break;
            case 'SET_TOOL': currentTool = msg.payload; break;
            case 'SET_BRUSH_SIZE': currentBrushSize = msg.payload; break;
            case 'UNDO': undo(); break;
            case 'REDO': redo(); break;
            case 'RESET_ZOOM': transform = { ...initialTransform }; scheduleRedraw(); break;
            case 'GET_IMAGE_DATA': {
              const out = document.createElement('canvas');
              out.width = colorCanvas.width; out.height = colorCanvas.height;
              const o = out.getContext('2d');
              o.drawImage(colorCanvas, 0, 0);
              // Şeffaf outline üstte (net hat)
              o.drawImage(outlineCanvas, 0, 0);
              const dataUrl = out.toDataURL('image/png');
              window.ReactNativeWebView.postMessage(JSON.stringify({ type:'IMAGE_DATA', payload:dataUrl }));
              break;
            }
          }
        }catch(err){ console.error('WebView message error:', err); }
      });

      // Hazır bildir
      window.ReactNativeWebView.postMessage(JSON.stringify({ type:'READY' }));

    </script>
  </body>
  </html>
  `,
    []
  );

  // RN -> WebView state sync
  useEffect(() => {
    if (webViewRef.current && isWebViewReady) {
      webViewRef.current.postMessage(
        JSON.stringify({ type: "SET_COLOR", payload: selectedColor })
      );
    }
  }, [selectedColor, isWebViewReady]);

  useEffect(() => {
    if (webViewRef.current && isWebViewReady) {
      webViewRef.current.postMessage(
        JSON.stringify({ type: "SET_TOOL", payload: activeTool })
      );
    }
  }, [activeTool, isWebViewReady]);

  useEffect(() => {
    if (webViewRef.current && isWebViewReady) {
      webViewRef.current.postMessage(
        JSON.stringify({ type: "SET_BRUSH_SIZE", payload: brushSize })
      );
    }
  }, [brushSize, isWebViewReady]);

  const handleWebViewMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      if (message.type === "READY" && webViewRef.current) {
        setIsWebViewReady(true);
        // Eğer resim kaydedilmiş bir çalışma ise farklı bir mesaj gönder
        if (image.isSaved) {
          webViewRef.current.postMessage(
            JSON.stringify({
              type: "LOAD_SAVED_IMAGE",
              payload: image.resimUrl,
            })
          );
        } else {
          webViewRef.current.postMessage(
            JSON.stringify({ type: "SET_IMAGE", payload: image.resimUrl })
          );
        }
      }

      if (message.type === "IMAGE_DATA") {
        (async () => {
          try {
            // Eğer bu kaydedilmiş bir resmin GÜNCELLENMESİ ise:
            if (image.isSaved && image.id) {
              // 1. Yeni base64 ile yeni dosyaları oluştur
              const { asset: newAsset, appUri: newUri } =
                await saveBase64PNGToGallery(message.payload, { isAI: false });

              // 2. Sadece uygulama içindeki eski dosyayı sil
              if (image.uri && image.uri.startsWith("file://")) {
                try {
                  await FileSystem.deleteAsync(image.uri, { idempotent: true });
                } catch (e) {
                  console.warn("Eski uygulama içi dosya silinemedi:", e);
                }
              }

              // 3. Veritabanı kaydını yeni bilgilerle güncelle (yeni assetId ve yeni uri ile)
              await updateImageRecord(image.id, newAsset.id, newUri);

              Alert.alert(
                "Güncellendi",
                "Çizimin yeni hali galerine kaydedildi.",
                [{ text: "Tamam" }]
              );
              navigation?.navigate("MyGalleryScreen", { refresh: Date.now() });
            } else {
              // Eğer bu YENİ bir kayıt ise:
              const { asset, appUri } = await saveBase64PNGToGallery(
                message.payload,
                { isAI: false }
              );
              const id = uid();
              await insertImage({
                id,
                assetId: asset.id,
                uri: appUri,
                album: "USER",
                createdAt: Date.now(),
              });
              Alert.alert(
                "Kaydedildi",
                "Çizimlerin hem telefon galerine hem de uygulama galerisine kaydedildi.",
                [{ text: "Tamam" }]
              );
              navigation?.navigate("MyGalleryScreen", { refresh: Date.now() });
            }
          } catch (err) {
            console.warn(err);
            Alert.alert("Hata", "Kaydetme sırasında bir sorun oluştu.");
          }
        })();
      }
    } catch (e) {
      console.error("Mesaj ayrıştırma hatası:", e);
    }
  };

  // Komutlar
  const handleUndo = () =>
    webViewRef.current?.postMessage(JSON.stringify({ type: "UNDO" }));
  const handleRedo = () =>
    webViewRef.current?.postMessage(JSON.stringify({ type: "REDO" }));
  const handleDone = () =>
    webViewRef.current?.postMessage(JSON.stringify({ type: "GET_IMAGE_DATA" }));
  const handleResetZoom = () =>
    webViewRef.current?.postMessage(JSON.stringify({ type: "RESET_ZOOM" }));

  // Yatay renk paleti
  const renderColor = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.colorCircle,
        {
          backgroundColor: item,
          borderColor: selectedColor === item ? "#3B82F6" : "transparent",
        },
      ]}
      onPress={() => setSelectedColor(item)}
    />
  );

  const Tool = ({ tool, icon }) => (
    <TouchableOpacity
      style={[styles.toolButton, activeTool === tool && styles.activeTool]}
      onPress={() => setActiveTool(tool)}
    >
      <FontAwesome5
        name={icon}
        size={22}
        color={activeTool === tool ? "white" : "#4B5563"}
      />
    </TouchableOpacity>
  );

  const BrushSizeButton = ({ size, value }) => (
    <TouchableOpacity
      style={[
        styles.brushSizeButton,
        brushSize === value && styles.activeBrushSize,
      ]}
      onPress={() => setBrushSize(value)}
    >
      <View style={[styles.brushDot, { width: size, height: size }]} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Üst bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={28} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {image.sayfaAdi}
          </Text>
          <TouchableOpacity onPress={handleDone}>
            <Text style={styles.doneButton}>Kaydet</Text>
          </TouchableOpacity>
        </View>

        {/* Canvas */}
        <View style={styles.coloringArea}>
          <WebView
            ref={webViewRef}
            originWhitelist={["*"]}
            source={{ html: htmlContent }}
            style={styles.webview}
            onMessage={handleWebViewMessage}
            containerStyle={{ backgroundColor: "#E5E7EB" }}
            scrollEnabled={false}
            javaScriptEnabled
            domStorageEnabled
            onShouldStartLoadWithRequest={() => true}
          />
        </View>

        {/* Araç çubuğu + renk paleti (yatay) */}
        <View style={styles.toolbar}>
          {(activeTool === "brush" || activeTool === "eraser") && (
            <View style={styles.brushSizeContainer}>
              <Text style={styles.brushSizeLabel}>
                {activeTool === "eraser" ? "Silgi Boyutu:" : "Fırça Boyutu:"}
              </Text>
              <BrushSizeButton size={6} value={BRUSH_SIZES.small} />
              <BrushSizeButton size={10} value={BRUSH_SIZES.medium} />
              <BrushSizeButton size={14} value={BRUSH_SIZES.large} />
            </View>
          )}

          {/* Yatay renk paleti */}
          <FlatList
            data={COLORS}
            renderItem={renderColor}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.colorList}
          />

          <View style={styles.toolsContainer}>
            <Tool tool="fill" icon="fill-drip" />
            <Tool tool="brush" icon="paint-brush" />
            <Tool tool="eraser" icon="eraser" />
            <TouchableOpacity style={styles.toolButton} onPress={handleUndo}>
              <Feather name="rotate-ccw" size={22} color="#4B5563" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolButton} onPress={handleRedo}>
              <Feather name="rotate-cw" size={22} color="#4B5563" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toolButton}
              onPress={handleResetZoom}
            >
              <MaterialCommunityIcons
                name="magnify-close"
                size={24}
                color="#4B5563"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flex: 1, backgroundColor: "#E5E7EB" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  doneButton: { fontSize: 16, fontWeight: "bold", color: "#10B981" },

  coloringArea: { flex: 1, overflow: "hidden" },
  webview: { flex: 1, backgroundColor: "transparent" },

  toolbar: {
    paddingTop: 5,
    paddingBottom: 12,
    backgroundColor: "white",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },

  // Fırça/silgi boyutu
  brushSizeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    marginBottom: 4,
  },
  brushSizeLabel: {
    marginRight: 12,
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "500",
  },
  brushSizeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 6,
    backgroundColor: "#F3F4F6",
    borderWidth: 2,
    borderColor: "transparent",
  },
  activeBrushSize: { borderColor: "#8B5CF6", backgroundColor: "#EDE9FE" },
  brushDot: { backgroundColor: "#4B5563", borderRadius: 10 },

  // Yatay renk paleti
  colorList: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
  },
  colorCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginHorizontal: 6,
    borderWidth: 3,
    borderColor: "transparent",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
  },

  // Araçlar
  toolsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    marginTop: 5,
    marginHorizontal: 10,
  },
  toolButton: {
    padding: 12,
    borderRadius: 16,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  activeTool: {
    backgroundColor: "#8B5CF6",
    transform: [{ scale: 1.06 }],
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 10,
  },
});

export default ColoringScreen;
