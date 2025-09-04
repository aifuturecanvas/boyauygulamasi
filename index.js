// 1. Supabase'in düzgün çalışması için gereken polyfill'i en başa ekliyoruz.
import 'react-native-url-polyfill/auto';

import { registerRootComponent } from 'expo';
import App from './App';

// 2. Uygulamayı başlatıyoruz.
registerRootComponent(App);