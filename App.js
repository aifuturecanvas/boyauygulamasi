// App.js / App.jsx

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { initDb } from "./utils/db";

import AiCreationScreen from "./screens/AiCreationScreen";
import CategoryScreen from "./screens/CategoryScreen";
import ColoringListScreen from "./screens/ColoringListScreen";
import ColoringScreen from "./screens/ColoringScreen";
import GalleryScreen from "./screens/GalleryScreen";
import HomeScreen from "./screens/HomeScreen";
import MyGalleryScreen from "./screens/MyGalleryScreen";
import SubCategoryScreen from "./screens/SubCategoryScreen";
import FavoritesScreen from "./screens/FavoritesScreen";
import AwardsScreen from "./screens/AwardsScreen";
import AiComingSoonScreen from "./screens/AiComingSoonScreen";
import AiResultScreen from "./screens/AiResultScreen";
import ProfileScreen from "./screens/ProfileScreen";
import ParentalLockScreen from "./screens/ParentalLockScreen"; // Eklendi
import ParentalSettingsScreen from "./screens/ParentalSettingsScreen"; // Eklendi

const Stack = createNativeStackNavigator();

const App = () => {
  useEffect(() => {
    initDb();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Category" component={CategoryScreen} />
        <Stack.Screen name="SubCategoryScreen" component={SubCategoryScreen} />
        <Stack.Screen name="ColoringList" component={ColoringListScreen} />
        <Stack.Screen name="Coloring" component={ColoringScreen} />

        {/* AI Screens */}
        <Stack.Screen name="AiCreation" component={AiCreationScreen} />
        <Stack.Screen name="AiResult" component={AiResultScreen} />
        <Stack.Screen name="AiComingSoon" component={AiComingSoonScreen} />

        {/* Gallery Screens */}
        <Stack.Screen name="Gallery" component={GalleryScreen} />
        <Stack.Screen name="MyGalleryScreen" component={MyGalleryScreen} />

        {/* Other Screens */}
        <Stack.Screen name="Awards" component={AwardsScreen} />
        <Stack.Screen name="Favorites" component={FavoritesScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="ParentalLock" component={ParentalLockScreen} />
        <Stack.Screen
          name="ParentalSettings"
          component={ParentalSettingsScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
