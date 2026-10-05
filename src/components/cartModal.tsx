import React, { useMemo } from 'react';
import {
  Modal, View, Text, Image, StyleSheet, TouchableOpacity, FlatList,
} from 'react-native';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react-native';
import { useCart } from '../store/Cart';
import { getProductImage } from '../store/productImages';
import { useAppData, getAppPalette } from '../store/AppData';

interface CartModalProps {
  visible: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export default function CartModal({ visible, onClose, onCheckout }: CartModalProps) {
  const { items, addToCart, removeFromCart, cartTotal, mesa } = useCart();
  const { settings } = useAppData();
  const palette = getAppPalette(settings.darkMode);
  const styles = useMemo(() => createStyles(palette), [settings.darkMode]);

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <ShoppingBag size={22} color={palette.primary} />
              <Text style={styles.title}>Seu Pedido</Text>
              {mesa && <Text style={styles.mesaBadge}>Mesa {mesa}</Text>}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Fechar carrinho">
              <X size={20} color={palette.muted} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<View style={styles.emptyState}><ShoppingBag size={25} color={palette.muted} /><Text style={styles.emptyTitle}>Sua sacola está vazia</Text><Text style={styles.emptySubtitle}>Adicione itens do cardápio para continuar.</Text></View>}
            renderItem={({ item }) => {
              const itemPrice = typeof item.price === 'string' ? parseFloat(item.price.replace(',', '.')) : item.price;
              return (
                <View style={styles.itemRow}>
                  <Image source={getProductImage(item.imageKey)} style={styles.itemImage} />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemPrice}>R$ {(itemPrice * item.quantity).toFixed(2).replace('.', ',')}</Text>
                  </View>
                  <View style={styles.quantityContainer}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(item.id)} accessibilityLabel="Diminuir quantidade">
                      {item.quantity === 1 ? <Trash2 size={16} color={palette.primary} /> : <Minus size={16} color={palette.text} />}
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => addToCart(item)} accessibilityLabel="Aumentar quantidade">
                      <Plus size={16} color={palette.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>R$ {cartTotal.toFixed(2).replace('.', ',')}</Text>
            </View>
            <TouchableOpacity style={[styles.checkoutBtn, !items.length && styles.checkoutBtnDisabled]} onPress={onCheckout} disabled={!items.length}>
              <Text style={styles.checkoutBtnText}>{items.length ? 'Avançar para Pagamento' : 'Adicione itens para continuar'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (palette: ReturnType<typeof getAppPalette>) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: palette.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  handle: { width: 40, height: 4, backgroundColor: palette.raised, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: palette.border },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 18, fontWeight: 'bold', color: palette.text },
  mesaBadge: { backgroundColor: palette.primarySoft, color: palette.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, fontSize: 12, fontWeight: 'bold' },
  closeBtn: { padding: 4 },
  listContent: { paddingVertical: 12, gap: 16, flexGrow: 1 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemImage: { width: 54, height: 54, borderRadius: 10, backgroundColor: palette.raised },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '600', color: palette.text },
  itemPrice: { fontSize: 14, color: palette.muted, marginTop: 2 },
  quantityContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: palette.raised, borderRadius: 12, padding: 4, gap: 12 },
  qtyBtn: { width: 28, height: 28, backgroundColor: palette.surface, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontSize: 14, fontWeight: 'bold', color: palette.text },
  footer: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: palette.border, gap: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, color: palette.muted },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: palette.text },
  checkoutBtn: { height: 52, backgroundColor: palette.primary, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  checkoutBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  checkoutBtnDisabled: { backgroundColor: '#777777' },
  emptyState: { flex: 1, minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: palette.text },
  emptySubtitle: { fontSize: 13, color: palette.muted, textAlign: 'center' },
});
