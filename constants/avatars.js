// constants/avatars.js

// 1. Adım: Tüm avatarları bir "harita" içinde tanımlıyoruz.
// Bu, "animal_01" gibi bir anahtarı, gerçek resim dosyasına bağlıyor.
export const AVATAR_MAP = {
  default_01: require("../assets/avatars/default-avatar-01.png"),
  animal_01: require("../assets/avatars/animal_avatar-01.png"),
  animal_02: require("../assets/avatars/animal_avatar-02.png"),
  animal_03: require("../assets/avatars/animal_avatar-03.png"),
  animal_04: require("../assets/avatars/animal_avatar-04.png"),
  animal_05: require("../assets/avatars/animal_avatar-05.png"),
  animal_06: require("../assets/avatars/animal_avatar-06.png"),
  animal_07: require("../assets/avatars/animal_avatar-07.png"),
  animal_08: require("../assets/avatars/animal_avatar-08.png"),
  animal_09: require("../assets/avatars/animal_avatar-09.png"),
  animal_10: require("../assets/avatars/animal_avatar-10.png"),
  animal_11: require("../assets/avatars/animal_avatar-11.png"),
  animal_12: require("../assets/avatars/animal_avatar-12.png"),
  animal_13: require("../assets/avatars/animal_avatar-13.png"),
  fantasy_01: require("../assets/avatars/fantasy_avatar-01.png"),
  fantasy_02: require("../assets/avatars/fantasy_avatar-02.png"),
  fantasy_03: require("../assets/avatars/fantasy_avatar-03.png"),
  fantasy_04: require("../assets/avatars/fantasy_avatar-04.png"),
  fantasy_05: require("../assets/avatars/fantasy_avatar-05.png"),
  fantasy_06: require("../assets/avatars/fantasy_avatar-06.png"),
  fantasy_07: require("../assets/avatars/fantasy_avatar-07.png"),
  fantasy_08: require("../assets/avatars/fantasy_avatar-08.png"),
  fantasy_09: require("../assets/avatars/fantasy_avatar-09.png"),
  fantasy_10: require("../assets/avatars/fantasy_avatar-10.png"),
  human_01: require("../assets/avatars/human_avatar-01.png"),
  human_02: require("../assets/avatars/human_avatar-02.png"),
  human_03: require("../assets/avatars/human_avatar-03.png"),
  human_04: require("../assets/avatars/human_avatar-04.png"),
  human_05: require("../assets/avatars/human_avatar-05.png"),
  human_06: require("../assets/avatars/human_avatar-06.png"),
  human_07: require("../assets/avatars/human_avatar-07.png"),
  human_08: require("../assets/avatars/human_avatar-08.png"),
  human_09: require("../assets/avatars/human_avatar-09.png"),
  human_10: require("../assets/avatars/human_avatar-10.png"),
};

// 2. Adım: Her kategori için anahtarları listeliyoruz.
const ANIMAL_KEYS = Array.from(
  { length: 13 },
  (_, i) => `animal_${String(i + 1).padStart(2, "0")}`
);
const FANTASY_KEYS = Array.from(
  { length: 10 },
  (_, i) => `fantasy_${String(i + 1).padStart(2, "0")}`
);
const HUMAN_KEYS = Array.from(
  { length: 10 },
  (_, i) => `human_${String(i + 1).padStart(2, "0")}`
);

// 3. Adım: Profil ekranında kullanılacak kategorize edilmiş listeyi oluşturuyoruz.
export const AVATAR_CATEGORIES = [
  { title: "Hayvanlar", data: ANIMAL_KEYS },
  { title: "Fantastik", data: FANTASY_KEYS },
  { title: "İnsanlar", data: HUMAN_KEYS },
];

// 4. Adım: Varsayılan avatar için anahtarı belirliyoruz.
export const DEFAULT_AVATAR_KEY = "default_01";
