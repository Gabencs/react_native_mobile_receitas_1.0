import React, { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert, Image } from 'react-native';
import { ShoppingBag, Flame, ArrowLeft, BellRing, Heart } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCart } from '../store/Cart';
import { useAppData } from '../store/AppData';
import { getProductImage } from '../store/productImages';
import { TableSession } from '../store/table-session';
import CartBar from '../components/cartBar';
import CartModal from '../components/cartModal';

type RootStackParamList = { homeView: { scan?: boolean } | undefined; cardapioView: { category?: string; orderType?: string } | undefined; Checkout: { orderType?: string } | undefined };
type Props = Partial<NativeStackScreenProps<RootStackParamList, 'cardapioView'>>;
const LIGHT_COLORS = { background: '#FFF8F1', white: '#FFFFFF', dark: '#352419', primary: '#F07818', grayLight: '#F5E8DA', border: '#E8D6C4', textMain: '#302219', textMuted: '#817165' };
const DARK_COLORS = { background: '#121212', white: '#1E1E1E', dark: '#303030', primary: '#F07818', grayLight: '#292929', border: '#3B3B3B', textMain: '#F5F5F5', textMuted: '#B0B0B0' };

function getFilters(category: string) {
  const cat = category.toLowerCase().trim();
  if (cat.includes('bebida')) return ['Todos', 'Sem álcool', 'Com álcool'];
  if (cat.includes('lanche')) return ['Todos', 'Hambúrgueres', 'Porções'];
  if (cat.includes('prato')) return ['Todos', 'Tradicional', 'Especiais'];
  if (cat.includes('porç')) return ['Todos', 'Petiscos', 'Fritas'];
  if (cat.includes('sobremesa')) return ['Todos', 'Doces', 'Gelados'];
  return ['Todos', 'Cortes', 'Espetinhos'];
}

function getProducts(category: string) {
  const cat = category.toLowerCase().trim();
  if (cat.includes('churrasco')) return [
    { id: '1', title: 'Picanha na brasa', desc: '300g, sal de parrilla e farofa da casa', price: '54.00', icon: '🥩', badge: 'Mais pedido', group: 'Cortes', imageKey: 'picanha' },
    { id: '2', title: 'Costela fogo lento', desc: 'Macia, defumada por 8 horas', price: '48.00', icon: '🍖', badge: null, group: 'Cortes', imageKey: 'costela' },
    { id: '3', title: 'Linguiça campeira', desc: 'Acompanha pão de alho', price: '32.00', icon: '🌭', badge: null, group: 'Espetinhos', imageKey: 'linguica' },
  ];
  if (cat.includes('lanche')) return [
    { id: '4', title: 'X-Burguer Artesanal', desc: 'Hambúrguer 180g, queijo cheddar e molho especial', price: '28.00', icon: '🍔', badge: 'Mais pedido', group: 'Hambúrgueres', imageKey: 'x-burguer' },
    { id: '5', title: 'Smash Bacon', desc: 'Dois discos de 90g, muito bacon e queijo prato', price: '32.00', icon: '🥓', badge: null, group: 'Hambúrgueres', imageKey: 'smash-bacon' },
  ];
  if (cat.includes('prato')) return [
    { id: '6', title: 'PF de Bife acebolado', desc: 'Arroz, feijão, bife de alcatra, batata frita e salada', price: '25.00', icon: '🍽️', badge: 'Popular', group: 'Tradicional', imageKey: 'pf-bife-acebolado' },
    { id: '7', title: 'PF de Frango Grelhado', desc: 'Arroz integral, feijão, filé de frango e legumes', price: '22.00', icon: '🥗', badge: null, group: 'Tradicional', imageKey: 'pf-frango-grelhado' },
  ];
  if (cat.includes('bebida')) return [
    { id: '8', title: 'Refrigerante Lata', desc: '350ml - Coca-Cola, Guaraná ou Soda', price: '6.00', icon: '🥤', badge: null, group: 'Sem álcool', imageKey: 'refrigerante-lata' },
    { id: '9', title: 'Cerveja Artesanal IPA', desc: '500ml bem gelada', price: '18.00', icon: '🍺', badge: 'Recomendado', group: 'Com álcool', imageKey: 'cerveja-ipa' },
    { id: '10', title: 'Suco Natural de Laranja', desc: 'Copão de 500ml sem açúcar', price: '9.00', icon: '🍊', badge: null, group: 'Sem álcool', imageKey: 'suco-laranja' },
  ];
  if (cat.includes('porç')) return [
    { id: '11', title: 'Batata Frita Suprema', desc: '500g com molho de queijo e bacon', price: '26.00', icon: '🍟', badge: 'Mais pedido', group: 'Fritas', imageKey: 'batata-frita-suprema' },
    { id: '12', title: 'Mandioca Frita', desc: 'Crocante por fora e macia por dentro', price: '20.00', icon: '🧆', badge: null, group: 'Petiscos', imageKey: 'mandioca-frita' },
  ];
  if (cat.includes('sobremesa')) return [
    { id: '13', title: 'Pudim de Leite Condensado', desc: 'Fatia generosa com calda de caramelo', price: '12.00', icon: '🍮', badge: 'Favorito', group: 'Doces', imageKey: 'pudim' },
    { id: '14', title: 'Petit Gâteau', desc: 'Acompanha uma bola de sorvete de baunilha', price: '18.00', icon: '🍨', badge: null, group: 'Gelados', imageKey: 'petit-gateau' },
  ];
  return [];
}

export default function MenuScreen({ route, navigation }: Props) {
  const category = route?.params?.category || 'Churrasco';
  const [activeFilter, setActiveFilter] = useState('Todos');
  const { addToCart, cartCount, mesa } = useCart();
  const { toggleFavorite, isFavorite, settings, requestWaiter, serviceCalls } = useAppData();
  const COLORS = settings.darkMode ? DARK_COLORS : LIGHT_COLORS;
  const styles = useMemo(() => createStyles(COLORS), [settings.darkMode]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCallingWaiter, setIsCallingWaiter] = useState(false);
  const activeTable = TableSession.getTable() || mesa || null;
  const orderType = activeTable ? 'local' : route?.params?.orderType || 'local';
  const existingTableCall = activeTable ? serviceCalls.find((call) => call.table === String(activeTable).replace(/^mesa\s*/i, '')) : undefined;
  const filters = getFilters(category);
  const products = getProducts(category).map((product) => ({ ...product, category }));
  const visibleProducts = useMemo(() => activeFilter === 'Todos' ? products : products.filter((item) => item.group === activeFilter), [activeFilter, category]);

  const handleCallWaiter = async () => {
    if (!activeTable) {
      Alert.alert('Mesa não identificada', 'Leia o QR Code da mesa antes de chamar o garçom.', [
        { text: 'Ir para identificar mesa', onPress: () => navigation?.navigate('homeView', { scan: true }) },
        { text: 'Cancelar', style: 'cancel' },
      ]);
      return;
    }
    if (isCallingWaiter) return;
    setIsCallingWaiter(true);
    try {
      const result = await requestWaiter(String(activeTable));
      Alert.alert(
        result.alreadyActive ? 'Chamado já registrado' : 'Garçom chamado',
        result.alreadyActive
          ? `A equipe já recebeu uma solicitação para a Mesa ${result.call.table}.`
          : `A solicitação foi enviada à equipe para a Mesa ${result.call.table}.`,
      );
    } catch (error: any) {
      Alert.alert('Não foi possível chamar', error?.message || 'Tente novamente.');
    } finally {
      setIsCallingWaiter(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation?.goBack()}><ArrowLeft color={COLORS.textMain} size={24} /></TouchableOpacity>
        <View style={styles.logoContainer}><View style={styles.logoIcon}><Flame color="#FFFFFF" size={16} /></View><View><Text style={styles.logoText}>Fogo & Fumaça</Text>{activeTable && <Text style={{ color: COLORS.textMuted, fontSize: 10 }}>Atendimento · Mesa {activeTable}</Text>}</View></View>
        <TouchableOpacity style={[styles.headerButton, styles.cartButton]} onPress={() => setIsCartOpen(true)}><ShoppingBag color={COLORS.white} size={20} />{cartCount > 0 && <View style={styles.badgeCount}><Text style={styles.badgeCountText}>{cartCount}</Text></View>}</TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}><ArrowLeft color={COLORS.textMuted} size={16} /><Text style={styles.backButtonText}>Todas as categorias</Text></TouchableOpacity>
        <View style={styles.categoryHeaderRow}><View><Text style={styles.categoryOverline}>Cardápio</Text><Text style={styles.categoryTitle}>{category}</Text></View><View style={styles.demoBadge}><Text style={styles.demoBadgeText}>Cardápio da casa</Text></View></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersWrapper} contentContainerStyle={styles.filtersContainer}>
          {filters.map((filter) => <TouchableOpacity key={filter} style={[styles.filterPill, activeFilter === filter && styles.activeFilterPill]} onPress={() => setActiveFilter(filter)}><Text style={[styles.filterPillText, activeFilter === filter && styles.activeFilterPillText]}>{filter}</Text></TouchableOpacity>)}
        </ScrollView>
        <View style={styles.productList}>
          {visibleProducts.map((item) => {
            const favorite = isFavorite(item.id);
            return <View key={item.id} style={styles.productCard}>
              <View style={styles.productImageArea}>
                <Image source={getProductImage(item.imageKey)} style={styles.productImage} resizeMode="cover" />
                <TouchableOpacity style={styles.favoriteButton} accessibilityLabel={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'} onPress={() => toggleFavorite({ id: item.id, title: item.title, desc: item.desc, price: item.price, category, imageKey: item.imageKey })}><Heart size={20} color={favorite ? COLORS.primary : COLORS.textMuted} fill={favorite ? COLORS.primary : 'transparent'} /></TouchableOpacity>
                {item.badge && <View style={styles.productBadge}><Text style={styles.productBadgeText}>{item.badge}</Text></View>}
              </View>
              <View style={styles.productInfoArea}><Text style={styles.productTitle}>{item.title}</Text><Text style={styles.productDesc}>{item.desc}</Text><View style={styles.productFooter}><Text style={styles.productPrice}>R$ {parseFloat(item.price).toFixed(2).replace('.', ',')}</Text><TouchableOpacity style={styles.addButton} onPress={() => { addToCart(item); Alert.alert('Adicionado à sacola', `${item.title} foi incluído no seu pedido.`); }}><Text style={styles.addButtonText}>+ Adicionar</Text></TouchableOpacity></View></View>
            </View>;
          })}
          {visibleProducts.length === 0 && <Text style={styles.emptyText}>Nenhum item nesta categoria.</Text>}
        </View>
      </ScrollView>

      <CartBar onPress={() => setIsCartOpen(true)} />
      <CartModal visible={isCartOpen} onClose={() => setIsCartOpen(false)} onCheckout={() => { setIsCartOpen(false); navigation?.navigate('Checkout', { orderType }); }} />
      <TouchableOpacity style={[styles.fab, cartCount > 0 && styles.fabAboveCart]} activeOpacity={0.9} onPress={handleCallWaiter} disabled={isCallingWaiter}><BellRing color="#FFFFFF" size={20} strokeWidth={2.5} /><Text style={styles.fabText}>{isCallingWaiter ? 'Enviando...' : existingTableCall ? `Chamado · Mesa ${activeTable}` : activeTable ? `Garçom · Mesa ${activeTable}` : 'Chamar garçom'}</Text></TouchableOpacity>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: typeof LIGHT_COLORS) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background }, scrollContent: { paddingBottom: 130 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 20 : 10, paddingBottom: 15 }, headerButton: { width: 44, height: 44, backgroundColor: COLORS.grayLight, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }, cartButton: { backgroundColor: COLORS.dark }, badgeCount: { position: 'absolute', top: -5, right: -5, backgroundColor: COLORS.primary, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }, badgeCountText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' }, logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 }, logoIcon: { backgroundColor: COLORS.primary, padding: 6, borderRadius: 8 }, logoText: { fontSize: 16, fontWeight: '700', color: COLORS.textMain }, backButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, marginBottom: 16 }, backButtonText: { color: COLORS.textMuted, fontSize: 14, fontWeight: '500' }, categoryHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, marginBottom: 20 }, categoryOverline: { fontSize: 12, color: COLORS.textMuted, marginBottom: 2 }, categoryTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.textMain, letterSpacing: -0.5 }, demoBadge: { borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }, demoBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.textMain }, filtersWrapper: { marginBottom: 24 }, filtersContainer: { paddingHorizontal: 20, gap: 12 }, filterPill: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border }, activeFilterPill: { backgroundColor: COLORS.primary, borderColor: COLORS.primary }, filterPillText: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted }, activeFilterPillText: { color: COLORS.white }, productList: { paddingHorizontal: 20, gap: 16 }, productCard: { backgroundColor: COLORS.white, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#EFECE7', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 }, productImageArea: { backgroundColor: '#e8e3db', height: 180, position: 'relative' }, productImage: { height: '100%', width: '100%' }, favoriteButton: { position: 'absolute', top: 12, left: 12, width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.94)' }, productBadge: { position: 'absolute', top: 14, right: 14, backgroundColor: '#AD381D', paddingVertical: 5, paddingHorizontal: 9, borderRadius: 7 }, productBadgeText: { color: COLORS.white, fontSize: 11, fontWeight: 'bold' }, productInfoArea: { padding: 16 }, productTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textMain, marginBottom: 6 }, productDesc: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18, marginBottom: 16 }, productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, productPrice: { fontSize: 16, fontWeight: 'bold', color: COLORS.textMain }, addButton: { backgroundColor: COLORS.primary, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 8 }, addButtonText: { color: COLORS.white, fontSize: 14, fontWeight: '700' }, fab: { position: 'absolute', bottom: 24, right: 20, backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 30, gap: 10, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }, fabAboveCart: { bottom: 94 }, fabText: { color: COLORS.white, fontSize: 15, fontWeight: '700' }, emptyText: { textAlign: 'center', padding: 30, color: COLORS.textMuted },
});
