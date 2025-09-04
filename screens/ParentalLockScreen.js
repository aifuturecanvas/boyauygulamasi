import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const ParentalLockScreen = ({ navigation }) => {
  const [answer, setAnswer] = useState("");

  // Her seferinde farklı bir soru üretmek için useMemo kullanıyoruz.
  const question = useMemo(() => {
    const num1 = Math.floor(Math.random() * 10) + 1; // 1-10 arası
    const num2 = Math.floor(Math.random() * 10) + 5; // 5-10 arası
    return {
      num1,
      num2,
      correctAnswer: num1 + num2,
    };
  }, []);

  const checkAnswer = () => {
    if (parseInt(answer, 10) === question.correctAnswer) {
      navigation.replace("ParentalSettings"); // Başarılı olursa Ayarlar ekranına git
    } else {
      Alert.alert("Yanlış Cevap", "Lütfen tekrar deneyin.");
      setAnswer("");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.closeButton}
          >
            <Feather name="x" size={32} color="#6B7280" />
          </TouchableOpacity>

          <View style={styles.content}>
            <Feather name="lock" size={48} color="#FBBF24" />
            <Text style={styles.title}>Ebeveyn Alanı</Text>
            <Text style={styles.instruction}>
              Devam etmek için lütfen aşağıdaki soruyu cevaplayın:
            </Text>

            <Text style={styles.questionText}>
              {question.num1} + {question.num2} = ?
            </Text>

            <TextInput
              style={styles.input}
              value={answer}
              onChangeText={setAnswer}
              placeholder="Cevap"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={3}
              textAlign="center"
              onSubmitEditing={checkAnswer}
            />

            <TouchableOpacity style={styles.submitButton} onPress={checkAnswer}>
              <Text style={styles.submitButtonText}>Devam Et</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  closeButton: {
    position: "absolute",
    top: 60,
    right: 20,
    padding: 10,
  },
  content: {
    width: "85%",
    maxWidth: 400,
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: 16,
  },
  instruction: {
    fontSize: 16,
    color: "#4B5563",
    textAlign: "center",
    marginTop: 8,
  },
  questionText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#8B5CF6",
    marginVertical: 24,
  },
  input: {
    backgroundColor: "white",
    width: "100%",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 22,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 20,
  },
  submitButton: {
    width: "100%",
    backgroundColor: "#10B981",
    paddingVertical: 18,
    borderRadius: 999,
    alignItems: "center",
  },
  submitButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default ParentalLockScreen;
