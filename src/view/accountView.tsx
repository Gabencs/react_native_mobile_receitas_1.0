import React, { useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ArrowLeft, Heart, Clock3, UserRound, MapPin, PackageCheck } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAuth } from '../controller/AuthController';
import { useAppData, getAppPalette } from '../store/AppData';
import { getProductImage, productImageKeyById } from '../store/productImages';

type Props = NativeStackScreenProps<RootStackParamList, 'accountView'>;
const money = (amount: number) => `R$ ${amount.toFixed(2).replace('.', ',')}`;

export default function AccountScreen({ route, navigation }: Props) {
  const section = route.params?.section || 'account';
  const { user, updateProfile } = useAuth();
  const { favorites, orders, settings } = useAppData();
  const palette = getAppPalette(settings.darkMode);
  const styles = useMemo(() => createStyles(palette), [settings.darkMode]);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const title = section === 'history' ? 'Histórico de Pedidos' : section === 'favorites' ? 'Meus Favoritos' : 'Minha Conta';

  const saveProfile = async () => {
    if (!name.trim() || !email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      Alert.alert('Confira seus dados', 'Informe seu nome e um e-mail válido.');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ name: name.trim(), email: email.trim() });
      Alert.alert('Conta atualizada', 'Seus dados foram salvos neste dispositivo.');
    } catch (error: any) {
      Alert.alert('Não foi possível salvar', error?.message || 'Tente novamente.');
    } finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}><ArrowLeft size={21} color={palette.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.back} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {section === 'history' && (
          orders.length ? orders.map((order) => (
            <View key={order.id} style={styles.card}>
              <View style={styles.orderTop}>
                <View style={styles.orderBadge}><PackageCheck size={17} color={palette.primary} /><Text style={styles.status}>{order.status}</Text></View>
                <Text style={styles.date}>{new Date(order.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</Text>
              </View>
              <Text style={styles.orderNumber}>Pedido #{order.id.slice(-6).toUpperCase()}</Text>
              {order.items.map((item, index) => (
                <View key={`${item.id}-${index}`} style={styles.orderLineRow}>
                  <Image source={getProductImage(productImageKeyById[item.id] || item.imageKey)} style={styles.orderImage} />
                  <Text style={styles.orderLine}>{item.quantity}× {item.title}</Text>
                </View>
              ))}
              <View style={styles.divider} />
              <View style={styles.summaryRow}><Text style={styles.muted}>Pagamento: {order.paymentLabel}</Text><Text style={styles.total}>{money(order.total)}</Text></View>
              <Text style={styles.muted}>{order.orderType === 'delivery' ? 'Entrega' : order.orderType === 'pickup' ? 'Retirada' : order.table ? `Mesa ${order.table}` : 'Pedido no local'}</Text>
            </View>
          )) : <Empty styles={styles} icon={<Clock3 color={palette.primary} size={26} />} title="Nenhum pedido ainda" description="Quando você concluir um pedido, ele aparecerá aqui." />
        )}

        {section === 'favorites' && (
          favorites.length ? favorites.map((product) => (
            <TouchableOpacity key={product.id} style={styles.favoriteCard} activeOpacity={0.85} onPress={() => navigation.navigate('cardapioView', { category: product.category })}>
              <Image source={getProductImage(productImageKeyById[product.id] || product.imageKey)} style={styles.favoriteImage} />
              <View style={styles.favoriteInfo}><Text style={styles.productName}>{product.title}</Text><Text style={styles.muted} numberOfLines={2}>{product.desc}</Text><Text style={styles.productPrice}>{money(Number(String(product.price).replace(',', '.')))}</Text></View>
              <Heart size={20} color={palette.primary} fill={palette.primary} />
            </TouchableOpacity>
          )) : <Empty styles={styles} icon={<Heart color={palette.primary} size={26} />} title="Sua lista está vazia" description="Toque no coração de um produto no cardápio para guardá-lo aqui." />
        )}

        {section === 'account' && (
          user ? <View style={styles.card}>
            <View style={styles.profileIcon}><UserRound color={palette.primary} size={27} /></View>
            <Text style={styles.sectionHeading}>Seus dados</Text>
            <Text style={styles.label}>Nome completo</Text><TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Seu nome" placeholderTextColor={palette.muted} />
            <Text style={styles.label}>E-mail</Text><TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="voce@email.com" placeholderTextColor={palette.muted} />
            <Text style={styles.label}>Endereço cadastrado</Text>
            <View style={styles.addressBox}><MapPin size={17} color={palette.muted} /><Text style={styles.addressText}>{[user.rua, user.numero, user.bairro, user.cidade, user.cep].filter(Boolean).join(', ') || 'Nenhum endereço informado no cadastro.'}</Text></View>
            <TouchableOpacity style={[styles.primaryButton, saving && styles.disabled]} disabled={saving} onPress={saveProfile}><Text style={styles.primaryButtonText}>{saving ? 'Salvando…' : 'Salvar alterações'}</Text></TouchableOpacity>
          </View> : <View style={styles.card}><View style={styles.profileIcon}><UserRound color={palette.primary} size={27} /></View><Text style={styles.sectionHeading}>Acesse sua conta</Text><Text style={styles.muted}>Entre ou crie uma conta para gerenciar seus dados e acompanhar seus pedidos.</Text><TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('loginView')}><Text style={styles.primaryButtonText}>Entrar</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('registerView')}><Text style={styles.secondaryText}>Criar conta</Text></TouchableOpacity></View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Empty({ styles, icon, title, description }: { styles: any; icon: React.ReactNode; title: string; description: string }) {
  return <View style={styles.empty}>{icon}<Text style={styles.emptyTitle}>{title}</Text><Text style={styles.muted}>{description}</Text></View>;
}

const createStyles = (palette: ReturnType<typeof getAppPalette>) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  header: { height: 60, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: palette.surface, borderBottomWidth: 1, borderColor: palette.border },
  back: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: palette.text },
  content: { padding: 18, gap: 14, flexGrow: 1 },
  card: { backgroundColor: palette.surface, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: palette.border, marginBottom: 12 },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  orderBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: palette.primarySoft, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 12 },
  status: { color: palette.primary, fontSize: 12, fontWeight: '700' },
  date: { color: palette.muted, fontSize: 12 },
  orderNumber: { fontSize: 16, fontWeight: '700', color: palette.text, marginBottom: 8 },
  orderLineRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginVertical: 3 },
  orderImage: { width: 38, height: 38, borderRadius: 8, backgroundColor: palette.raised },
  orderLine: { flex: 1, fontSize: 14, color: palette.text },
  divider: { height: 1, backgroundColor: palette.border, marginVertical: 12 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  total: { fontSize: 16, color: palette.primary, fontWeight: '800' },
  muted: { fontSize: 13, color: palette.muted, lineHeight: 19 },
  favoriteCard: { backgroundColor: palette.surface, borderRadius: 16, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, borderWidth: 1, borderColor: palette.border },
  favoriteImage: { width: 76, height: 76, borderRadius: 12, backgroundColor: palette.raised },
  favoriteInfo: { flex: 1, gap: 4 },
  productName: { fontSize: 15, fontWeight: '700', color: palette.text },
  productPrice: { fontSize: 14, fontWeight: '800', color: palette.primary, marginTop: 3 },
  empty: { flex: 1, minHeight: 320, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: palette.text, marginTop: 4 },
  profileIcon: { width: 58, height: 58, borderRadius: 18, backgroundColor: palette.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  sectionHeading: { fontSize: 20, fontWeight: '800', color: palette.text, marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: palette.text, marginBottom: 7 },
  input: { borderColor: palette.border, borderWidth: 1, borderRadius: 12, minHeight: 48, paddingHorizontal: 13, color: palette.text, marginBottom: 14, backgroundColor: palette.background },
  addressBox: { minHeight: 56, borderRadius: 12, backgroundColor: palette.raised, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 18 },
  addressText: { flex: 1, color: palette.muted, fontSize: 13, lineHeight: 18 },
  primaryButton: { height: 50, borderRadius: 13, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  disabled: { opacity: 0.6 },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondaryButton: { height: 46, alignItems: 'center', justifyContent: 'center', marginTop: 5 },
  secondaryText: { color: palette.primary, fontWeight: '700' },
});
