let currentTable = null;

export const TableSession = {
  // Define a mesa após escanear o QR Code
  setTable: (tableNumber) => {
    currentTable = tableNumber;
    console.log(`[Sessão] Mesa configurada para: ${tableNumber}`);
  },

  // Obtém a mesa atual (retorna null se não leu nenhum QR Code ainda)
  getTable: () => {
    return currentTable;
  },

  // Limpa a mesa ao finalizar a conta
  clearTable: () => {
    currentTable = null;
  }
};