import React, { useState, useEffect, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Alert,
  Pressable,
  ScrollView,
  View,
  Text,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import {
  Utensils,
  ChefHat,
  Coffee,
  Dessert,
  ScanLine,
  MapPin,
  Bike,
  Store,
  ChevronRight,
  Info,
  Menu,
  LucideIcon,
} from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Scanner from './scannerView';
import { SideMenu } from '../components/sideMenu';
import { RootStackParamList } from '../../App';
import { TableSession } from '../store/table-session';
import { useAuth } from '../controller/AuthController';
import { useAppData, getAppPalette } from '../store/AppData';
import { useCart } from '../store/Cart';

type Props = NativeStackScreenProps<RootStackParamList, 'homeView'>;

interface Category {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  imageUrl: string;
}

interface MenuConfig {
  eyebrow: string;
  title: string;
  description: string;
  categories: Category[];
}

const menuByService: Record<'local' | 'entrega' | 'retirada', MenuConfig> = {
  local: {
    eyebrow: 'Atendimento no restaurante',
    title: 'Escolha para a sua mesa',
    description: 'Navegue pelo cardápio e faça seu pedido quando estiver pronto.',
    categories: [
      {
        title: 'Churrasco',
        subtitle: 'Receitas para o almoço e jantar',
        icon: Utensils,
        imageUrl: 'https://img.magnific.com/fotos-premium/churrasco-tradicional-brasileiro-perto-do-fogo_70216-3339.jpg?semt=ais_hybrid&w=740&q=80',
      },
      {
        title: 'Lanches',
        subtitle: 'Para dividir ou matar a fome',
        icon: ChefHat,
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
      },
      {
        title: 'Prato Feito',
        subtitle: 'Receitas para o almoço e jantar',
        icon: Utensils,
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
      },
      {
        title: 'Bebidas',
        subtitle: 'Geladas, quentes e sem álcool',
        icon: Coffee,
        imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=80',
      },
      {
        title: 'Porções',
        subtitle: 'Para dividir ou matar a fome',
        icon: ChefHat,
        imageUrl: 'https://img.magnific.com/fotos-gratis/batatas-fritas-douradas-em-uma-cesta-de-vime-com-fundo-bokeh_84443-86965.jpg?semt=ais_hybrid&w=740&q=80',
      },
      {
        title: 'Sobremesas',
        subtitle: 'Um final doce para a refeição',
        icon: Dessert,
        imageUrl: 'https://cdn.pixabay.com/photo/2016/06/12/15/03/cupcakes-1452178_1280.jpg',
      },
    ],
  },
  entrega: {
    eyebrow: 'Entrega onde você estiver',
    title: 'Peça sem sair de casa',
    description: 'Veja as opções preparadas para viagem e receba com praticidade.',
    categories: [
      {
        title: 'Pratos feitos',
        subtitle: 'Refeições completas para hoje',
        icon: Utensils,
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
      },
      {
        title: 'Lanches',
        subtitle: 'Favoritos para pedir agora',
        icon: ChefHat,
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
      },
      {
        title: 'Bebidas',
        subtitle: 'Para acompanhar seu pedido',
        icon: Coffee,
        imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&q=80',
      },
      {
        title: 'Porções',
        subtitle: 'Boas para compartilhar',
        icon: Dessert,
        imageUrl: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&q=80',
      },
    ],
  },
  retirada: {
    eyebrow: 'Retirada no restaurante',
    title: 'Peça e retire no balcão',
    description: 'Faça seu pedido agora e retire no restaurante quando estiver pronto.',
    categories: [],
  },
};
menuByService.retirada.categories = menuByService.local.categories;

export default function HomeScreen({ navigation, route }: Props) {
  const { user, handleLogout, isAuthReady } = useAuth();
  const { settings } = useAppData();
  const { mesa, setMesa } = useCart();
  const palette = getAppPalette(settings.darkMode);
  const styles = useMemo(() => createStyles(palette), [settings.darkMode]);
  const [serviceMode, setServiceMode] = useState<'local' | 'entrega' | 'retirada'>('local');
  const [showScanner, setShowScanner] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Captura o parâmetro 'table' enviado pela URL ou rota
  const urlTable = route.params?.table;

  useEffect(() => {
    if (urlTable) {
      TableSession.setTable(urlTable);
      setMesa(urlTable);
    }
  }, [urlTable, setMesa]);

  useEffect(() => {
    if (route.params?.scan) {
      setShowScanner(true);
      navigation.setParams({ scan: undefined });
    }
  }, [route.params?.scan, navigation]);

  useEffect(() => {
    if (isAuthReady && user?.role === 'admin') navigation.replace('adminView');
  }, [isAuthReady, user?.role, navigation]);

  // Consulta a mesa gravada na sessão ou o parâmetro vindo da URL
  const activeTable = TableSession.getTable() || mesa || urlTable;

  const menu = menuByService[serviceMode];

  const handleScanSuccess = (data: string) => {
    let tableNum = data;
    if (data.includes('table=')) {
      tableNum = data.split('table=')[1].split('&')[0];
    }
    TableSession.setTable(tableNum);
    setMesa(tableNum);
    setShowScanner(false);
    Alert.alert('Mesa Identificada', `Mesa ${tableNum} salva na sessão!`);
  };

  const handleScannerOpen = () => {
    setShowScanner(true);
  };

  const handleCategory = (categoryTitle: string) => {
    navigation.navigate('cardapioView', { category: categoryTitle, orderType: serviceMode });
  };

  if (showScanner) {
    return (
      <Scanner
        onCodeRead={handleScanSuccess}
        onClose={() => setShowScanner(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Pressable style={styles.menuButton} onPress={() => setIsMenuOpen(true)}>
              <Menu size={22} color="#ffffff" />
            </Pressable>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.brandTitle}>Cardápio Nativo</Text>
              <Text style={styles.brandSubtitle}>Seu pedido, do seu jeito</Text>
            </View>
          </View>

          <View style={styles.qrCard}>
            <View style={styles.qrCardContent}>
              <View style={{ flex: 1 }}>
                <Text style={styles.qrTag}>
                  {activeTable ? 'MESA SELECIONADA' : 'COMECE POR AQUI'}
                </Text>
                <Text style={styles.qrTitle}>
                  {activeTable ? `Mesa: ${activeTable}` : 'Escaneie sua mesa'}
                </Text>
                <Text style={styles.qrSub}>
                  {activeTable
                    ? 'Seu atendimento já está personalizado para este local.'
                    : 'Use o QR code da mesa para personalizar seu atendimento.'}
                </Text>
              </View>
              <Pressable style={styles.qrButton} onPress={handleScannerOpen}>
                <ScanLine size={28} color="#ffffff" />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          <View style={styles.tabsWrapper}>
            <Pressable
              style={[styles.tab, serviceMode === 'local' && styles.activeTab]}
              onPress={() => setServiceMode('local')}>
              <View style={styles.tabContent}>
                <MapPin
                  size={16}
                  color={serviceMode === 'local' ? palette.primary : palette.muted}
                />
                <Text
                  style={[
                    styles.tabText,
                    serviceMode === 'local' && styles.activeTabText,
                  ]}>
                  No local
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={[styles.tab, serviceMode === 'entrega' && styles.activeTab]}
              disabled={!settings.deliveryEnabled}
              onPress={() => settings.deliveryEnabled ? setServiceMode('entrega') : Alert.alert('Entrega indisponível', 'A entrega está desativada nas configurações do restaurante.')}>
              <View style={styles.tabContent}>
                <Bike
                  size={16}
                  color={serviceMode === 'entrega' ? palette.primary : palette.muted}
                />
                <Text
                  style={[
                    styles.tabText,
                    serviceMode === 'entrega' && styles.activeTabText,
                  ]}>
                  Entrega
                </Text>
              </View>
            </Pressable>
            <Pressable
              style={[styles.tab, serviceMode === 'retirada' && styles.activeTab]}
              disabled={!settings.pickupEnabled}
              onPress={() => settings.pickupEnabled ? setServiceMode('retirada') : Alert.alert('Retirada indisponível', 'A retirada está desativada nas configurações do restaurante.')}>
              <View style={styles.tabContent}>
                <Store size={16} color={serviceMode === 'retirada' ? palette.primary : palette.muted} />
                <Text style={[styles.tabText, serviceMode === 'retirada' && styles.activeTabText]}>Retirada</Text>
              </View>
            </Pressable>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.sectionHeader}>
            <View style={styles.dot} />
            <Text style={styles.eyebrow}>{menu.eyebrow}</Text>
          </View>
          <Text style={styles.sectionTitle}>{menu.title}</Text>
          <Text style={styles.sectionSub}>{menu.description}</Text>

          <View style={styles.categoryList}>
            {menu.categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Pressable
                  key={category.title}
                  style={styles.categoryCardContainer}
                  onPress={() => handleCategory(category.title)}>
                  <ImageBackground
                    source={{ uri: category.imageUrl }}
                    style={styles.categoryBackgroundImage}
                    imageStyle={{ borderRadius: 16 }}>
                    <View style={styles.categoryOverlay}>
                      <View style={styles.categoryIconBg}>
                        <IconComponent size={20} color={palette.primary} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 16 }}>
                        <Text style={styles.categoryTitle}>{category.title}</Text>
                        <Text style={styles.categorySub}>{category.subtitle}</Text>
                      </View>
                      <ChevronRight size={20} color="#ffffff" />
                    </View>
                  </ImageBackground>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.infoBox}>
            <Info size={20} color={palette.primary} />
            <Text style={styles.infoText}>
              {activeTable
                ? `Você está atendido na Mesa ${activeTable}.`
                : 'Você pode visualizar o cardápio livremente ou escanear a mesa a qualquer momento.'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Componente do Menu Lateral */}
      <SideMenu
        open={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onNavigate={(section) => {
          setIsMenuOpen(false);
          navigation.navigate('accountView', { section });
        }}
        onSignIn={() => {
          setIsMenuOpen(false);
          navigation.navigate('loginView');
        }}
        onSignOut={async () => {
          setIsMenuOpen(false);
          await handleLogout();
          Alert.alert('Sessão encerrada', 'Você saiu da sua conta neste dispositivo.');
        }}
        user={user}
      />
    </SafeAreaView>
  );
}

const createStyles = (palette: ReturnType<typeof getAppPalette>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  menuButton: {
    height: 44,
    width: 44,
    borderRadius: 16,
    backgroundColor: palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.muted,
  },
  brandSubtitle: {
    fontSize: 12,
    color: palette.muted,
    marginTop: 2,
  },
  qrCard: {
    marginTop: 20,
    borderRadius: 24,
    backgroundColor: palette.surface,
    padding: 20,
  },
  qrCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  qrTag: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.primary,
  },
  qrTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: palette.text,
    marginTop: 6,
  },
  qrSub: {
    fontSize: 13,
    color: palette.muted,
    marginTop: 6,
    lineHeight: 18,
  },
  qrButton: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: palette.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    marginTop: 28,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  tabsWrapper: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: palette.primary,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: palette.muted,
  },
  activeTabText: {
    color: palette.text,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.primary,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.muted,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: palette.text,
    marginTop: 8,
  },
  sectionSub: {
    fontSize: 14,
    color: palette.muted,
    marginTop: 6,
    lineHeight: 20,
  },
  categoryList: {
    marginTop: 24,
    gap: 12,
  },
  categoryCardContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  categoryBackgroundImage: {
    width: '100%',
  },
  categoryOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    padding: 16,
    borderRadius: 16,
  },
  categoryIconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  categorySub: {
    fontSize: 12,
    color: '#e4e4e7',
    marginTop: 2,
  },
  infoBox: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: palette.surface,
    padding: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: palette.text,
    lineHeight: 18,
  },
});
