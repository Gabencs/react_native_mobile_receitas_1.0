import React, { useState, useMemo, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { X, Wifi, CreditCard } from 'lucide-react-native';
import { useCart } from '../store/Cart';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { TableSession } from '../store/table-session';
import { useAppData, getAppPalette } from '../store/AppData';

const getCheckoutPalette = (darkMode: boolean) => {
  const palette = getAppPalette(darkMode);
  return {
    overlayBg: 'rgba(26, 26, 26, 0.6)',
    cardBg: palette.surface,
    primary: palette.primary,
    primaryLight: palette.primarySoft,
    grayLight: palette.raised,
    grayCircle: palette.raised,
    border: palette.border,
    textMain: palette.text,
    textMuted: palette.muted,
    textOverline: palette.muted,
  };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

function isValidCardNumber(digits: string) {
  if (digits.length !== 16) return false;
  let sum = 0;
  for (let index = digits.length - 1, position = 0; index >= 0; index -= 1, position += 1) {
    let digit = Number(digits[index]);
    if (position % 2 === 1) { digit *= 2; if (digit > 9) digit -= 9; }
    sum += digit;
  }
  return sum % 10 === 0;
}

function isValidExpiry(value: string) {
  if (!/^\d{2}\/\d{2}$/.test(value)) return false;
  const [monthText, yearText] = value.split('/');
  const month = Number(monthText);
  const year = 2000 + Number(yearText);
  const now = new Date();
  return month >= 1 && month <= 12 && (year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1));
}

export default function CheckoutScreen({ route, navigation }: Props) {
  const { addOrder, settings } = useAppData();
  const COLORS = getCheckoutPalette(settings.darkMode);
  const styles = useMemo(() => createStyles(COLORS), [settings.darkMode]);
  const { items, cartTotal, clearCart, mesa } = useCart();
  // 1. Consulta a mesa salva na sessão
  const activeTable = TableSession.getTable() || mesa;

  // 2. Se houver mesa guardada, força OBRIGATORIAMENTE o tipo 'local'
  const orderType = activeTable ? 'local' : (route?.params?.orderType || 'local');
  const isDelivery = orderType === 'delivery';
  const isPickup = orderType === 'pickup';

  const availablePaymentOptions = [
    ...(settings.paymentMethods.pix ? [{ id: 'pix', label: 'Pix' }] : []),
    ...(settings.paymentMethods.credit || settings.paymentMethods.debit ? [{ id: 'cartao', label: 'Cartão' }] : []),
    ...(settings.paymentMethods.cash ? [{ id: 'dinheiro', label: 'Dinheiro' }] : []),
    ...(!isDelivery && settings.paymentMethods.payAtCounter ? [{ id: 'caixa', label: 'Pagar no caixa' }] : []),
  ];
  const paymentOptionsKey = availablePaymentOptions.map((option) => option.id).join('|');
  const [paymentMethod, setPaymentMethod] = useState(availablePaymentOptions[0]?.id || '');
  const [changeAmount, setChangeAmount] = useState('');

  // Estados do formulário de cartão
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardFocused, setCardFocused] = useState<'number' | 'name' | 'expiry' | 'cvv' | null>(null);
  const [cardType, setCardType] = useState<'Crédito' | 'Débito'>(settings.paymentMethods.credit ? 'Crédito' : 'Débito');
  const [installments, setInstallments] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // 3. Puxa dados do carrinho
  useEffect(() => {
    if (!availablePaymentOptions.some((option) => option.id === paymentMethod)) {
      setPaymentMethod(availablePaymentOptions[0]?.id || '');
    }
  }, [paymentOptionsKey, paymentMethod]);
  useEffect(() => {
    if (cardType === 'Crédito' && !settings.paymentMethods.credit && settings.paymentMethods.debit) setCardType('Débito');
    if (cardType === 'Débito' && !settings.paymentMethods.debit && settings.paymentMethods.credit) setCardType('Crédito');
  }, [settings.paymentMethods.credit, settings.paymentMethods.debit, cardType]);

  // Formatação do número do cartão: 0000 0000 0000 0000
  const handleCardNumberChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 16);
    const formatted = digits.replace(/(.{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  // Formatação da validade: MM/AA
  const handleExpiryChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 4);
    const formatted = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    setCardExpiry(formatted);
  };

  const cardDigits = cardNumber.replace(/\D/g, '');
  const maskedDigits = (cardDigits + '••••••••••••••••'.slice(cardDigits.length)).slice(0, 16);
  const displayCardNumber = maskedDigits.replace(/(.{4})/g, '$1 ').trim();

  // Exibe o título dinâmico com base na mesa
  const title = isDelivery
    ? 'Pagamento da entrega' 
    : isPickup ? 'Pagamento da retirada' : (activeTable ? `Pagamento - Mesa ${activeTable}` : 'Pagamento no local');
    
  const totalLabel = isDelivery ? 'Total com entrega' : isPickup ? 'Total da retirada' : 'Total da comanda';
  
  // Calcula o valor final (+ R$ 6,00 apenas se for entrega)
  const valorFinal = isDelivery ? cartTotal + 6.00 : cartTotal;
  const totalValue = `R$ ${valorFinal.toFixed(2).replace('.', ',')}`;

  const isCardIncomplete = paymentMethod === 'cartao' &&
    (!isValidCardNumber(cardDigits) || cardName.trim().length < 3 || !isValidExpiry(cardExpiry) || cardCvv.length < 3);

  const isButtonDisabled =
    items.length === 0 || !paymentMethod || isProcessing || (paymentMethod === 'dinheiro' && changeAmount.trim() === '') || isCardIncomplete;

  // 4. Validação, processamento demonstrativo e gravação do pedido
  const handleFinalizeOrder = async () => {
    if (!items.length) {
      Alert.alert('Carrinho vazio', 'Adicione itens antes de finalizar o pedido.');
      return;
    }
    if (isDelivery && !settings.deliveryEnabled) {
      Alert.alert('Entrega indisponível', 'O restaurante desativou os pedidos para entrega.');
      return;
    }
    if (isPickup && !settings.pickupEnabled) {
      Alert.alert('Retirada indisponível', 'O restaurante desativou os pedidos para retirada.');
      return;
    }
    if (!availablePaymentOptions.length) {
      Alert.alert('Pagamento indisponível', 'O restaurante ainda não habilitou uma forma de pagamento.');
      return;
    }
    // Se for pedido no local sem mesa identificada
    if (!isDelivery && !activeTable) {
      Alert.alert(
        'Mesa não identificada',
        'Para realizar o pedido no local, por favor escaneie o QR Code localizado na sua mesa.',
        [
          { 
            text: 'Escanear QR Code', 
            onPress: () => navigation.navigate('homeView' as never)
          },
          { text: 'Cancelar', style: 'cancel' }
        ]
      );
      return;
    }

    if (paymentMethod === 'dinheiro') {
      const amount = Number(changeAmount.replace(',', '.'));
      if (!Number.isFinite(amount) || amount < valorFinal) {
        Alert.alert('Valor insuficiente', 'Informe um valor igual ou maior que o total do pedido.');
        return;
      }
    }

    setIsProcessing(true);
    try {
      // Pequeno intervalo intencional para representar autorização e confirmação do pagamento.
      await new Promise((resolve) => setTimeout(resolve, 1600));
      const paymentLabel = paymentMethod === 'cartao'
        ? `Cartão ${cardType.toLowerCase()} •••• ${cardDigits.slice(-4)}${cardType === 'Crédito' && installments > 1 ? ` (${installments}x)` : ''}`
        : paymentMethod === 'pix' ? 'Pix' : paymentMethod === 'dinheiro' ? 'Dinheiro' : 'Pagar no caixa';
      await addOrder({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
        status: 'Confirmado',
        items: items.map((item) => ({ id: item.id, title: item.title, price: Number(String(item.price).replace(',', '.')) || 0, quantity: item.quantity, imageKey: item.imageKey })),
        total: valorFinal,
        paymentMethod,
        paymentLabel,
        orderType: isDelivery ? 'delivery' : isPickup ? 'pickup' : 'local',
        table: activeTable,
      });
      clearCart();
      navigation.navigate('homeView' as never);
      Alert.alert('Pedido confirmado!', isDelivery ? 'Pagamento simulado processado e pedido enviado para entrega.' : `Pedido confirmado e enviado para a cozinha${activeTable ? ` da Mesa ${activeTable}` : ''}.`);
    } catch {
      Alert.alert('Não foi possível confirmar', 'Ocorreu um erro ao registrar o pedido. Seus itens continuam no carrinho.');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderPaymentOption = (id: string, label: string) => {
    const isSelected = paymentMethod === id;
    return (
      <TouchableOpacity 
        key={id} 
        style={[styles.radioCard, isSelected && styles.radioCardSelected]} 
        onPress={() => setPaymentMethod(id)} 
        activeOpacity={0.8}
      >
        <Text style={[styles.radioLabel, isSelected && styles.radioLabelSelected]}>{label}</Text>
        <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalCard}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            <View style={styles.header}>
              <View>
                <Text style={styles.headerOverline}>Finalizar pedido</Text>
                <Text style={styles.headerTitle}>{title}</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
                <X color={COLORS.textMain} size={18} />
              </TouchableOpacity>
            </View>

            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>{totalLabel}</Text>
              <Text style={styles.totalValue}>{totalValue}</Text>
            </View>

            <Text style={styles.sectionTitle}>Como você quer pagar?</Text>

            <View style={styles.optionsContainer}>
              {availablePaymentOptions.map((option) => renderPaymentOption(option.id, option.label))}
              {availablePaymentOptions.length === 0 && <Text style={styles.emptyPaymentText}>Não há formas de pagamento habilitadas. Peça ajuda à equipe.</Text>}
            </View>

            {paymentMethod === 'pix' && (
              <View style={styles.pixContainer}>
                <Text style={styles.pixTitle}>PIX copia e cola</Text>
                <Text style={styles.pixSubtitle}>Use o código abaixo no app do seu banco.</Text>
                <View style={styles.pixCodeBox}>
                  <Text style={styles.pixCodeText}>
                    00020101021226890014br.gov.bcb.pix2567fogoefumaca.demo/pix/97a2a3b4c5d65204000053039865802BR5920Fogo e Fumaca LTDA6009Sao Paulo62070503***6304DEMO
                  </Text>
                </View>
                <TouchableOpacity style={styles.copyButton} onPress={() => Share.share({ message: 'PIX demonstrativo: 00020101021226890014br.gov.bcb.pix2567fogoefumaca.demo/pix/97a2a3b4c5d65204000053039865802BR5920Fogo e Fumaca LTDA6009Sao Paulo62070503***6304DEMO' })}>
                  <Text style={styles.copyButtonText}>Compartilhar código demonstrativo</Text>
                </TouchableOpacity>
              </View>
            )}

            {paymentMethod === 'dinheiro' && (
              <View style={styles.cashContainer}>
                <Text style={styles.cashTitle}>Com quanto você vai pagar?</Text>
                <TextInput 
                  style={styles.cashInput} 
                  placeholder="Ex.: 100,00" 
                  placeholderTextColor={COLORS.textMuted} 
                  keyboardType="numeric" 
                  value={changeAmount} 
                  onChangeText={setChangeAmount} 
                />
              </View>
            )}

            {paymentMethod === 'cartao' && (
              <View style={styles.cardContainer}>
                <Text style={styles.cardFieldLabel}>Tipo de cartão</Text>
                <View style={styles.cardTypeRow}>
                  {(['Crédito', 'Débito'] as const).filter((type) => type === 'Crédito' ? settings.paymentMethods.credit : settings.paymentMethods.debit).map((type) => <TouchableOpacity key={type} style={[styles.cardTypeButton, cardType === type && styles.cardTypeButtonSelected]} onPress={() => setCardType(type)}><Text style={[styles.cardTypeText, cardType === type && styles.cardTypeTextSelected]}>{type}</Text></TouchableOpacity>)}
                </View>
                {cardType === 'Crédito' && <View style={styles.installmentBox}><Text style={styles.cardFieldLabel}>Parcelamento sem juros</Text><View style={styles.cardTypeRow}>{[1, 2, 3].map((count) => <TouchableOpacity key={count} style={[styles.installmentButton, installments === count && styles.cardTypeButtonSelected]} onPress={() => setInstallments(count)}><Text style={[styles.cardTypeText, installments === count && styles.cardTypeTextSelected]}>{count}x</Text></TouchableOpacity>)}</View></View>}
                {/* Preview visual do cartão */}
                <View style={styles.creditCard}>
                  <View style={styles.creditCardTopRow}>
                    <View style={styles.chip} />
                    <Wifi color="rgba(255,255,255,0.85)" size={20} style={{ transform: [{ rotate: '90deg' }] }} />
                  </View>
                  <Text style={styles.creditCardNumber}>{displayCardNumber}</Text>
                  <View style={styles.creditCardBottomRow}>
                    <View>
                      <Text style={styles.creditCardLabel}>NOME NO CARTÃO</Text>
                      <Text style={styles.creditCardValue} numberOfLines={1}>
                        {cardName.trim() ? cardName.toUpperCase() : 'SEU NOME AQUI'}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.creditCardLabel}>VALIDADE</Text>
                      <Text style={styles.creditCardValue}>{cardExpiry || 'MM/AA'}</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.cardFieldLabel}>Número do cartão</Text>
                <View style={[styles.cardInputWrapper, cardFocused === 'number' && styles.cardInputWrapperFocused]}>
                  <CreditCard color={COLORS.textMuted} size={18} />
                  <TextInput
                    style={styles.cardInput}
                    placeholder="0000 0000 0000 0000"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                    maxLength={19}
                    value={cardNumber}
                    onChangeText={handleCardNumberChange}
                    onFocus={() => setCardFocused('number')}
                    onBlur={() => setCardFocused(null)}
                  />
                </View>

                <Text style={styles.cardFieldLabel}>Nome impresso no cartão</Text>
                <View style={[styles.cardInputWrapper, cardFocused === 'name' && styles.cardInputWrapperFocused]}>
                  <TextInput
                    style={styles.cardInput}
                    placeholder="Ex.: MARIA S SILVA"
                    placeholderTextColor={COLORS.textMuted}
                    autoCapitalize="characters"
                    value={cardName}
                    onChangeText={setCardName}
                    onFocus={() => setCardFocused('name')}
                    onBlur={() => setCardFocused(null)}
                  />
                </View>

                <View style={styles.cardRow}>
                  <View style={styles.cardRowItem}>
                    <Text style={styles.cardFieldLabel}>Validade</Text>
                    <View style={[styles.cardInputWrapper, cardFocused === 'expiry' && styles.cardInputWrapperFocused]}>
                      <TextInput
                        style={styles.cardInput}
                        placeholder="MM/AA"
                        placeholderTextColor={COLORS.textMuted}
                        keyboardType="numeric"
                        maxLength={5}
                        value={cardExpiry}
                        onChangeText={handleExpiryChange}
                        onFocus={() => setCardFocused('expiry')}
                        onBlur={() => setCardFocused(null)}
                      />
                    </View>
                  </View>
                  <View style={styles.cardRowItem}>
                    <Text style={styles.cardFieldLabel}>CVV</Text>
                    <View style={[styles.cardInputWrapper, cardFocused === 'cvv' && styles.cardInputWrapperFocused]}>
                      <TextInput
                        style={styles.cardInput}
                        placeholder="123"
                        placeholderTextColor={COLORS.textMuted}
                        keyboardType="numeric"
                        maxLength={4}
                        secureTextEntry
                        value={cardCvv}
                        onChangeText={(t) => setCardCvv(t.replace(/\D/g, ''))}
                        onFocus={() => setCardFocused('cvv')}
                        onBlur={() => setCardFocused(null)}
                      />
                    </View>
                  </View>
                </View>
              </View>
            )}

            {paymentMethod === 'caixa' && (
              <View style={styles.caixaContainer}>
                <Text style={styles.caixaTitle}>Itens do pedido</Text>
                {items.map((item) => {
                  const unitPrice = typeof item.price === 'string'
                    ? parseFloat(item.price.replace(',', '.'))
                    : item.price;
                  const lineTotal = unitPrice * item.quantity;
                  return (
                    <View key={item.id} style={styles.caixaItemRow}>
                      <Text style={styles.caixaItemQty}>{item.quantity}x</Text>
                      <Text style={styles.caixaItemName} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.caixaItemPrice}>
                        R$ {lineTotal.toFixed(2).replace('.', ',')}
                      </Text>
                    </View>
                  );
                })}
                <View style={styles.caixaDivider} />
                <View style={styles.caixaTotalRow}>
                  <Text style={styles.caixaTotalLabel}>Total a pagar no caixa</Text>
                  <Text style={styles.caixaTotalValue}>{totalValue}</Text>
                </View>
                <Text style={styles.caixaHint}>
                  Mostre esta tela ao atendente para efetuar o pagamento.
                </Text>
              </View>
            )}

            <TouchableOpacity 
              style={[styles.submitButton, isButtonDisabled && styles.submitButtonDisabled]}
              disabled={isButtonDisabled}
              onPress={handleFinalizeOrder}
            >
              {isProcessing ? <><ActivityIndicator color="#fff" /><Text style={styles.submitButtonText}> Processando e confirmando…</Text></> : <Text style={styles.submitButtonText}>{paymentMethod === 'pix' || paymentMethod === 'cartao' ? 'Pagar e confirmar pedido' : 'Confirmar pedido'}</Text>}
            </TouchableOpacity>

            <Text style={styles.footerDisclaimer}>
              Ambiente de demonstração: nenhuma cobrança real será realizada e os dados do cartão não são armazenados.
            </Text>

          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ReturnType<typeof getCheckoutPalette>) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.overlayBg },
  keyboardView: { flex: 1, justifyContent: 'center', paddingHorizontal: 20, paddingTop: 40, paddingBottom: 20 },
  modalCard: { backgroundColor: COLORS.cardBg, borderRadius: 24, maxHeight: '95%', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  scrollContent: { padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  headerOverline: { fontSize: 12, color: COLORS.textMuted, marginBottom: 4 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.textMain, letterSpacing: -0.5 },
  closeButton: { width: 32, height: 32, backgroundColor: COLORS.grayCircle, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  totalBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.grayLight, padding: 16, borderRadius: 12, marginBottom: 24 },
  totalLabel: { fontSize: 14, color: COLORS.textMuted },
  totalValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.textMain },
  sectionTitle: { fontSize: 13, color: COLORS.textMain, marginBottom: 12 },
  optionsContainer: { gap: 12, marginBottom: 20 },
  emptyPaymentText: { color: COLORS.textMuted, fontSize: 13, lineHeight: 18 },
  radioCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 16 },
  radioCardSelected: { borderColor: COLORS.primary, backgroundColor: '#FFFBF9' },
  radioLabel: { fontSize: 15, fontWeight: '600', color: COLORS.textMain },
  radioLabelSelected: { color: COLORS.textMain },
  radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.border },
  radioCircleSelected: { borderColor: COLORS.primary, borderWidth: 5 },
  pixContainer: { backgroundColor: COLORS.primaryLight, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F9D8D2', marginBottom: 20 },
  pixTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.primary, marginBottom: 4 },
  pixSubtitle: { fontSize: 13, color: COLORS.textMuted, marginBottom: 16 },
  pixCodeBox: { backgroundColor: COLORS.cardBg, borderRadius: 8, padding: 12, marginBottom: 16 },
  pixCodeText: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18 },
  copyButton: { backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  copyButtonText: { fontSize: 14, fontWeight: 'bold', color: COLORS.textMain },
  cashContainer: { backgroundColor: COLORS.grayLight, borderRadius: 16, padding: 16, marginBottom: 20 },
  cashTitle: { fontSize: 13, color: COLORS.textMain, marginBottom: 10 },
  cashInput: { backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, fontSize: 15, color: COLORS.textMain },

  // Cartão de crédito/débito
  cardContainer: { marginBottom: 20 },
  creditCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    height: 170,
    justifyContent: 'space-between',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  creditCardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chip: { width: 40, height: 28, borderRadius: 6, backgroundColor: '#D4AF6A' },
  creditCardNumber: { color: '#FFFFFF', fontSize: 20, fontWeight: '600', letterSpacing: 2 },
  creditCardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  creditCardLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 9, letterSpacing: 1, marginBottom: 4 },
  creditCardValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', maxWidth: 180 },
  cardFieldLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 6, marginTop: 4 },
  cardInputWrapper: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.grayLight, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 12, marginBottom: 14 },
  cardInputWrapperFocused: { borderColor: COLORS.primary, backgroundColor: COLORS.cardBg },
  cardInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: COLORS.textMain },
  cardRow: { flexDirection: 'row', gap: 12 },
  cardRowItem: { flex: 1 },
  cardTypeRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  cardTypeButton: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingVertical: 11, alignItems: 'center', backgroundColor: COLORS.cardBg },
  cardTypeButtonSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  cardTypeText: { color: COLORS.textMuted, fontSize: 14, fontWeight: '600' },
  cardTypeTextSelected: { color: COLORS.primary },
  installmentBox: { marginBottom: 8 },
  installmentButton: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 9, paddingVertical: 9, alignItems: 'center', backgroundColor: COLORS.cardBg },

  // Pagar no caixa
  caixaContainer: { backgroundColor: COLORS.grayLight, borderRadius: 16, padding: 16, marginBottom: 20 },
  caixaTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textMain, marginBottom: 12 },
  caixaItemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  caixaItemQty: { fontSize: 13, fontWeight: '700', color: COLORS.primary, width: 28 },
  caixaItemName: { flex: 1, fontSize: 14, color: COLORS.textMain },
  caixaItemPrice: { fontSize: 14, fontWeight: '600', color: COLORS.textMain },
  caixaDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  caixaTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  caixaTotalLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textMain },
  caixaTotalValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  caixaHint: { fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic' },
  submitButton: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  submitButtonDisabled: { backgroundColor: '#DFA89A' },
  submitButtonText: { color: COLORS.cardBg, fontSize: 16, fontWeight: 'bold' },
  footerDisclaimer: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center' }
});
