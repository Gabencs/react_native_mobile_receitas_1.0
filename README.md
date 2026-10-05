# Cardápio Nativo - Mobile (React Native + Expo)

O Cardápio Nativo é um aplicativo mobile desenvolvido em React Native* com Expo, focado em oferecer uma experiência simples e intuitiva para visualização de cardápios, navegação de produtos e realização de pedidos.

## Tecnologias e Bibliotecas

   [React Native](https://reactnative.dev/): Framework para desenvolvimento mobile multiplataforma.
   
   [Expo CLI](https://docs.expo.dev/): Ferramenta de desenvolvimento e execução do ecossistema React Native.
   
   [Lucide React Native](https://lucide.dev/): Conjunto de ícones vetoriais leves e modernos.
   
   [React Native SVG](https://github.com/software-mansion/react-native-svg): Suporte à renderização de ícones e ilustrações vetoriais em formato SVG.

## Guia de Instalação e Configuração

Siga as instruções abaixo para clonar o repositório, instalar todas as dependências e executar a aplicação no seu ambiente de desenvolvimento.

## Pré-requisitos

Antes de iniciar, certifique-se de possuir em sua máquina:

   [Node.js](https://nodejs.org/) (Versão LTS recomendada).
    
   [Git](https://git-scm.com/) instalado.
    
   Aplicativo **Expo Go** no celular ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779)) ou um Emulador Android / Simulador iOS configurado.

### 1. Clonar o Repositório

    git clone React_Native_Mobile
    cd React_Native_Mobile

### 2. Instalar Dependências

Para baixar os pacotes do projeto (incluindo o lucide-react-native e o react-native-svg), execute no terminal da raiz do projeto:

    npm install

Caso o terminal exiba avisos de conflito de versões legadas (ERESOLVE), utilize a flag --legacy-peer-deps:

    npm install --legacy-peer-deps

Instalar as dependencias do DraftBit

    npx expo install @draftbit/ui react-native-svg

Necessario renomear App.js para App.tsx

### 3. Iniciar o Projeto

Após a instalação das dependências, rode o comando do Expo limpando o cache do Metro Bundler:

    npx expo start -c

### 4. Como visualizar o App:
No celular físico: Abra o app Expo Go, escaneie o QR Code exibido no terminal (no Android) ou pela Câmera (no iOS). Nota: O celular e o computador devem estar na mesma rede Wi-Fi.

Na Web: Pressione w no terminal para abrir no navegador.

No Emulador Android: Pressione a no terminal (requer Android Studio).

No Simulador iOS: Pressione i no terminal (requer Xcode no macOS).

# Fluxo de Trabalho para Colaboradores
Sempre que puxar novas atualizações do repositório remoto, siga esta rotina para manter o ambiente sincronizado e sem erros de dependências:

### 1. Puxar alterações da branch principal
    git pull origin main

### 2. Instalar novas bibliotecas adicionadas pela equipe
    npm install --legacy-peer-deps

### 3. Rodar o servidor limpando o cache
    npx expo start -c
    npx expo start --clear

## Estrutura de Pastas

```
React_Native_Mobile/
├── assets/          # Imagens, fontes e recursos estáticos
├── src/
│   ├── models/      # Regras de negócio e estruturas de dados (Ex: userModel.js)
│   └── screens/     # Telas do aplicativo (Ex: LoginScreen.js)
├── App.js           # Ponto de entrada da aplicação
├── app.json         # Configurações do Expo
├── babel.config.js  # Configuração de presets do Babel
└── package.json     # Scripts e dependências do projeto
```


## Funcionalidades atualizadas

- 14 fotos locais distintas por produto, otimizadas para o cardápio, com miniaturas no carrinho.
- Favoritos, carrinho, contas de demonstração e histórico de pedidos persistidos localmente no dispositivo com AsyncStorage.
- Cadastro com validação, dados de endereço e restauração de sessão; login demo: `cliente@fogo.com` / `123` (admin demo: `admin@fogo.com` / `123`).
- Ao entrar com `admin@fogo.com` e senha `123`, o app abre o dashboard administrativo laranja com vendas dos últimos 7 dias, faturamento do mês e ranking crescente de receita simulada por produto.
- Tela “Minha Conta” com edição de nome e e-mail; menu lateral abre conta, favoritos e histórico.
- Checkout demonstrativo com Pix, crédito/débito, parcelamento sem juros, dinheiro (com troco) e pagamento no caixa. O pedido só é registrado depois da etapa de processamento/confirmação simulada.

> Este projeto não possui gateway de pagamento nem backend de produção. Nenhum valor é cobrado e os dados do cartão não são armazenados. As credenciais e os dados locais são apenas para demonstração; não use este armazenamento como autenticação de produção.


### Novas melhorias administrativas e do cliente

- Configurações do restaurante (nome, endereço, telefone, horário e preparo), opções Pix/dinheiro/crédito/débito/pagar no caixa e disponibilidade de entrega/retirada agora podem ser alteradas e salvas localmente.
- O modo escuro é persistente e aplicado ao painel, Home, cardápio, carrinho, checkout, conta/histórico e menu lateral.
- O cliente vê o número da mesa lido pelo QR Code na Home, no cardápio, no carrinho e no checkout. “Chamar garçom” cria um chamado com a mesa e impede duplicação enquanto ele estiver ativo.
- Os chamados podem ser vistos no dashboard administrativo e na tela Atendimento, com ações para assumir e concluir; alertas locais podem vibrar quando habilitados.
- Alteração de senha valida a senha atual e exige no mínimo 6 caracteres para a nova. O botão de sessão encerra a sessão deste dispositivo.
- As miniaturas por produto também aparecem nos favoritos, carrinho e histórico.

> A fila de chamados, preferências e pedidos são dados locais do protótipo: aparecem entre telas no mesmo dispositivo/instalação, mas ainda não são sincronizados em tempo real com aparelhos diferentes. A vibração depende do suporte do dispositivo. Para operação real em múltiplos dispositivos, é necessário conectar um backend/API e serviço de notificações.

Validação de desenvolvimento executada: `npm run typecheck`, `npx expo export -p web` e `npx expo export -p android`.
