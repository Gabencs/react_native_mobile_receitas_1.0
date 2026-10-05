const productImages: Record<string, any> = {
  picanha: require('../../assets/products/picanha.jpg'),
  costela: require('../../assets/products/costela.jpg'),
  linguica: require('../../assets/products/linguica.jpg'),
  'x-burguer': require('../../assets/products/x-burguer.jpg'),
  'smash-bacon': require('../../assets/products/smash-bacon.jpg'),
  'pf-bife-acebolado': require('../../assets/products/pf-bife-acebolado.jpg'),
  'pf-frango-grelhado': require('../../assets/products/pf-frango-grelhado.jpg'),
  'refrigerante-lata': require('../../assets/products/refrigerante-lata.jpg'),
  'cerveja-ipa': require('../../assets/products/cerveja-ipa.jpg'),
  'suco-laranja': require('../../assets/products/suco-laranja.jpg'),
  'batata-frita-suprema': require('../../assets/products/batata-frita-suprema.jpg'),
  'mandioca-frita': require('../../assets/products/mandioca-frita.jpg'),
  pudim: require('../../assets/products/pudim.jpg'),
  'petit-gateau': require('../../assets/products/petit-gateau.jpg'),
  // Compatibilidade com favoritos gravados antes da atualização.
  grill: require('../../assets/products/picanha.jpg'),
  burger: require('../../assets/products/x-burguer.jpg'),
  meal: require('../../assets/products/pf-bife-acebolado.jpg'),
  drinks: require('../../assets/products/refrigerante-lata.jpg'),
  'sides-dessert': require('../../assets/products/batata-frita-suprema.jpg'),
};

export const productImageKeyById: Record<string, string> = {
  '1': 'picanha', '2': 'costela', '3': 'linguica', '4': 'x-burguer',
  '5': 'smash-bacon', '6': 'pf-bife-acebolado', '7': 'pf-frango-grelhado',
  '8': 'refrigerante-lata', '9': 'cerveja-ipa', '10': 'suco-laranja',
  '11': 'batata-frita-suprema', '12': 'mandioca-frita', '13': 'pudim', '14': 'petit-gateau',
};

export function getProductImage(imageKey?: string) {
  return productImages[imageKey || ''] || productImages.picanha;
}
