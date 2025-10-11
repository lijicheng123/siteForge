// enums.ts

// 1. 核心功能分类
export const PatternCategoryEnum = [
    "Hero",           // 网站首屏大图/核心价值区域
    "Features",       // 特性/优势介绍
    "CTA",            // 行动号召
    "Pricing",      // 价格表
    "Testimonials",   // 客户评价/见证
    "FAQ",            // 常见问题解答
    "Team",           // 团队介绍
    "Gallery",        // 图库/作品集展示
    "Contact",      // 联系表单/联系信息
    "Content",        // 通用内容/图文排版
    "Logos",          // 客户/合作伙伴Logo墙
    "Stats",          // 数据/统计展示
    "HowItWorks",     // 工作流程/步骤说明
    "Header",         // 网站页头
    "Footer",         // 网站页脚
    "Location",       // 地理位置/地图
    "Blog",           // 博客列表/文章摘要
    "Services",       // 服务项目列表
    "Video",          // 视频展示
    "Newsletter"      // 邮件订阅
  ];
  
  // 2. 适用页面类型
  export const PageTypeEnum = [
    "HomePage", "AboutPage", "ContactPage", "ServicesPage", "TeamPage",
    "ProductListPage", "ProductSinglePage", "PricingPage", "FeaturesPage", "ShopPage", "CartPage", "CheckoutPage", "MyAccountPage",
    "BlogListPage", "BlogSinglePage", "NewsPage", "CaseStudyListPage", "CaseStudySinglePage",
    "PortfolioListPage", "PortfolioSinglePage",
    "LandingPage", "FAQPage", "LoginPage", "RegisterPage", "CareersPage", "TermsOfServicePage", "PrivacyPolicyPage", "Error404Page"
  ];
  
  // 3. 行业/用例
  export const IndustryEnum = [
    "IndustrialEquipment", "Machinery", "ConsumerElectronics", "ElectronicComponents", "HomeAppliances", "HardwareAndTools", "TextilesAndApparel", "HomeGoods", "BuildingMaterials", "AutoParts", "ChemicalsAndMaterials", "NewEnergy", "MedicalDevices", "ToysAndGifts", "BeautyAndPersonalCare",
    "ForeignTradeServices", "SupplyChain", "LogisticsAndWarehousing", "OEM_ODM",
    "B2B", "Corporate", "Enterprise", "ECommerce", "SaaS", "Technology", "Startup", "Software", "MobileApp", "AI", "FinTech", "Crypto", "Consulting", "Agency", "Finance", "Legal", "RealEstate", "Portfolio", "Designer", "Photographer", "Freelancer", "Blog", "Magazine", "Retail", "Fashion", "FoodAndBeverage", "Travel", "Education", "Healthcare", "NonProfit", "Events", "Restaurant", "Wellness", "Fitness"
  ];
  
  // 4. 风格
  export const StyleEnum = [
    "Minimalist", "Modern", "Clean", "Corporate", "Elegant", "Playful", "Bold", "Geometric", "Organic",
    "Colorful", "Monochromatic", "Professional", "Friendly", "Luxurious", "Tech",
    "Brutalist", "Retro", "Flat", "Glassmorphism", "Neumorphism", "Industrial"
  ];
  
  // 5. 布局结构
  export const LayoutStructureEnum = [
    "Horizontal", "Vertical", "Grid", "Centered", "Mixed"
  ];