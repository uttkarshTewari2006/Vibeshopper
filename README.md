<div align="center">
  <img src="sua/src/public/vibeshopperlogo.svg" alt="VibeShopper Logo" width="500"/>
  
  *A personalized shopping assistant that learns your preferences and delivers a curated feed of products that match your style, price range, size, and design choices — all within Shopify stores.*
</div>

---

## 🌟 Overview

VibeShopper is an innovative **Shopify Shop Mini** that revolutionizes the shopping experience through AI-powered personalization, augmented reality (AR) visualization, and intelligent product discovery. Built with React and TypeScript, it leverages cutting-edge technologies to create a seamless, mobile-first shopping experience that understands your vibe and delivers spot-on product recommendations.

## ✨ Key Features

### 🤖 **AI-Powered Intelligence**
- **Smart Category Generation**: Uses Claude 3.5 Sonnet to analyze shopping intent and generate practical, shoppable categories
- **Style Detection**: Upload photos or describe your style to find matching items
- **Dynamic Recommendations**: AI adapts suggestions based on user interactions and preferences
- **Natural Language Processing**: Describe your shopping needs in plain English

### 🥽 **Augmented Reality (AR) Experience**
- **3D Product Visualization**: Interactive 3D models with AR support using `@google/model-viewer`
- **AR Shopping Cart**: Rotating 3D cart animation for immersive experience
- **WebXR Integration**: Full AR support for mobile devices
- **Room Preview**: Visualize products in your space before purchasing

### 🛍️ **Advanced Shopping Features**
- **Real-time Product Search**: Live search with instant results using Shopify's `useProductSearch` hook
- **Smart Filtering**: Automatic filters based on size, budget, and style preferences
- **One-Click Checkout**: Seamless integration with Shopify's checkout system
- **Wishlist Management**: Save products for later with price drop alerts
- **Bundle Recommendations**: AI suggests complementary products for complete looks

### 📊 **Comprehensive Analytics & Data Management**
- **Local Database**: IndexedDB with Dexie for offline-first data persistence
- **User Behavior Tracking**: Comprehensive analytics on shopping patterns
- **AI Usage Analytics**: Track AI model performance and generation success rates
- **Real-time Sync**: Automatic synchronization with Shopify's product catalog
- **Export Capabilities**: Data export for insights and analysis

### 🎨 **Modern UI/UX**
- **Mobile-First Design**: Optimized for touch interactions and mobile devices
- **Glassmorphism Effects**: Beautiful glass surfaces with backdrop blur
- **Smooth Animations**: View transitions and micro-interactions
- **Responsive Layout**: Adapts to different screen sizes
- **Accessibility**: Built with accessibility best practices

## 🏗️ Technical Architecture

### **Frontend Stack**
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS 4** for styling
- **Three.js** & **React Three Fiber** for 3D graphics
- **@react-three/drei** for 3D utilities

### **AI & Machine Learning**
- **Fal.ai** for AI image generation and processing
- **Claude 3.5 Sonnet** for natural language understanding
- **Multiple AI Models**: Flux Pro, Stable Diffusion XL, and more

### **Data Layer**
- **IndexedDB** with **Dexie** for local storage
- **Shopify Shop Minis API** for product data
- **Real-time synchronization** with Shopify's catalog
- **Comprehensive analytics** tracking

### **3D & AR**
- **@google/model-viewer** for 3D model rendering
- **WebXR** for augmented reality
- **Three.js** for custom 3D interactions
- **GLB/GLTF** model support

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Shopify Partner Account** (for Shop Mini development)
- **Fal.ai API Key** (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd shopify-hackathon
   ```

2. **Install dependencies**
   ```bash
   cd sua
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the `sua` directory:
   ```env
   VITE_FAL_KEY=your_fal_ai_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Access the application**
   - The app will be available at the URL provided by the Shopify CLI
   - Or access directly through your Shopify development store

### Development Commands

```bash
# Start development server
npm start

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📱 Usage Guide

### **Getting Started**
1. **Launch the App**: Open VibeShopper in your mobile browser or Shopify app
2. **Describe Your Vibe**: Use natural language to describe what you're looking for
3. **Explore Categories**: AI generates relevant shopping categories based on your input
4. **Browse Products**: View curated products with AR previews
5. **Add to Cart**: One-click add to cart with Shopify integration

### **AI-Powered Shopping**
- **Natural Language Input**: "I need a cozy midnight-blue athleisure fit"
- **Image Upload**: Upload photos for style matching
- **Refinement**: Continuously refine your search with follow-up prompts
- **Bundle Suggestions**: Get complete outfit or product bundle recommendations

### **AR Features**
- **3D Product View**: Rotate and examine products in 3D
- **AR Placement**: Use your camera to place products in your space
- **Room Preview**: See how products look in different environments

## 🔧 Configuration

### **Shopify Integration**
The app uses multiple Shopify Shop Minis hooks:
- `usePopularProducts` - Trending products
- `useProductSearch` - Real-time search
- `useRecommendedProducts` - Personalized recommendations
- `useSavedProducts` - Wishlist management
- `useCurrentUser` - User information
- `useFollowedShops` - Shop following

### **AI Configuration**
Configure AI models in `src/lib/fal.ts`:
```typescript
export const FAL_MODELS = {
  FLUX_PRO: "fal-ai/flux-pro",
  FLUX_SCHNELL: "fal-ai/flux/schnell",
  STABLE_DIFFUSION_XL: "fal-ai/stable-diffusion-xl",
}
```

### **Database Schema**
The app uses a comprehensive database schema with tables for:
- Products and product images
- Shops and user data
- Analytics and user behavior
- AI interactions and generated content
- Search queries and results

## 📊 Analytics & Insights

### **User Behavior Tracking**
- Page views and navigation patterns
- Search queries and result interactions
- Product engagement (views, saves, cart additions)
- AR model interactions and usage

### **AI Performance Metrics**
- Generation success rates
- Processing times for different models
- User satisfaction with AI recommendations
- Model usage patterns and preferences

### **Business Intelligence**
- Popular product categories
- User engagement trends
- Conversion funnel analysis
- AR feature adoption rates

## 🛠️ Customization

### **Adding New AI Models**
1. Add model configuration to `src/lib/fal.ts`
2. Implement model-specific logic in `src/hooks/useFal.ts`
3. Update UI components to support new model types

### **Custom 3D Models**
1. Add GLB/GLTF files to `src/public/`
2. Update model references in components
3. Configure AR settings in `RotatingCart.tsx`

### **Styling Customization**
- Modify `src/index.css` for global styles
- Update Tailwind configuration for design system
- Customize component styles in individual files

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Shopify** for the Shop Minis platform and APIs
- **Fal.ai** for AI model integration
- **Three.js** community for 3D graphics
- **React Three Fiber** for React 3D integration
- **Tailwind CSS** for the design system

---

## 👥 Development Team

**VibeShopper** was built by a talented team of developers passionate about revolutionizing the shopping experience:

- **Swayam Parekh** - [GitHub](https://github.com/swyxm) • [Email](mailto:swayampa@usc.edu) • [ai+cs+ba@usc](https://usc.edu)
- **Soham Jain** - [GitHub](https://github.com/J8Soham)
- **Aradhya Kapoor** - [GitHub](https://github.com/Aradhya2005)
- **Uttkarsh Tewari** - [GitHub](https://github.com/uttkarshtewari2006)

---

<div align="center">
  <p>Built with ❤️ for the future of shopping</p>
  <p>
    <a href="#-overview">Overview</a> •
    <a href="#-key-features">Features</a> •
    <a href="#-getting-started">Setup</a> •
    <a href="#-usage-guide">Usage</a> •
    <a href="#-contributing">Contributing</a>
  </p>
</div>

