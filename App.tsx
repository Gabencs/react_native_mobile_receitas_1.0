import React from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from './src/controller/AuthController';
import { CartProvider } from './src/store/Cart';
import { AppDataProvider } from './src/store/AppData';
import homeView from './src/view/homeView';
import cardapioView from './src/view/cardapioView';
import loginView from './src/view/loginView';
import registerView from './src/view/registerView';
import CheckoutScreen from './src/view/checkoutView';
import atendimentoView from './src/view/atendimentoView';
import cozinhaView from './src/view/cozinhaView';
import adminView from './src/view/adminView';
import AccountScreen from './src/view/accountView';

export type RootStackParamList = {
  homeView: { table?: string; scan?: boolean } | undefined;
  cardapioView: { category?: string; orderType?: string } | undefined;
  loginView: undefined;
  registerView: undefined;
  Checkout: { orderType?: string } | undefined;
  accountView: { section: 'history' | 'favorites' | 'account' };
  adminView: undefined;
  atendimentoView: undefined;
  cozinhaView: undefined;
  scannerView: undefined;
};

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['http://localhost:8081', 'http://localhost:19006', 'https://seu-app.vercel.app'],
  config: { screens: { homeView: '', cardapioView: 'cardapioView', Checkout: 'Checkout', accountView: 'accountView', adminView: 'AdminView', atendimentoView: 'atendimentoView', cozinhaView: 'cozinhaView' } },
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <CartProvider>
          <NavigationContainer linking={linking}>
            <Stack.Navigator initialRouteName="homeView" screenOptions={{ headerShown: false }}>
              <Stack.Screen name="homeView" component={homeView} />
              <Stack.Screen name="cardapioView" component={cardapioView} />
              <Stack.Screen name="loginView" component={loginView} />
              <Stack.Screen name="registerView" component={registerView} />
              <Stack.Screen name="Checkout" component={CheckoutScreen} />
              <Stack.Screen name="accountView" component={AccountScreen} />
              <Stack.Screen name="adminView" component={adminView} />
              <Stack.Screen name="atendimentoView" component={atendimentoView} />
              <Stack.Screen name="cozinhaView" component={cozinhaView} />
            </Stack.Navigator>
          </NavigationContainer>
        </CartProvider>
      </AppDataProvider>
    </AuthProvider>
  );
}
