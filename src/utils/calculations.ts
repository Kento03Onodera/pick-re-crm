import { Lead } from "@/types/lead";

export { type Lead };

export const calculateEstimatedRevenue = (lead: Lead): number => {
  return (lead.budget * 0.03 * lead.discountRate) + 60000;
};

export const MOCK_LEADS: Lead[] = [
  {
    id: '1',
    leadType: 'Buy',
    name: '田中 太郎',
    tel: '090-1234-5678',
    mail: 'tanaka@example.com',
    status: 'New',
    priority: 'High',
    budget: 50000000,
    discountRate: 1.0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    areas: ['渋谷区', '目黒区'],
    tags: ['初回', '即決'],
    age: 35,
    familyStructure: 'Family with kids',
    agentName: '佐藤 エージェント',
    activities: [
      {
        id: 'a1',
        type: 'Call',
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        content: '初回ヒアリング実施。予算感とエリアの再確認。来週の土曜日に内見予定。',
        agentName: '佐藤 エージェント'
      },
      {
        id: 'a2',
        type: 'Email',
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        content: '物件資料A、B、Cを送付しました。開封確認済み。',
        agentName: '佐藤 エージェント'
      },
      {
        id: 'a3',
        type: 'Note',
        timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        content: '奥様の実家が目黒区のため、目黒区中心に探したいとのこと。',
        agentName: '佐藤 エージェント'
      }
    ],
    inquiredProperties: [
      {
        id: 'p1',
        name: 'パークコート渋谷ザ・タワー',
        address: '東京都渋谷区宇田川町',
        price: 150000000,
        inquiredAt: new Date(Date.now() - 604800000).toISOString()
      },
      {
        id: 'p2',
        name: 'シティタワー恵比寿',
        address: '東京都渋谷区恵比寿',
        price: 120000000,
        inquiredAt: new Date(Date.now() - 1209600000).toISOString()
      }
    ]
  },
  {
    id: '2',
    leadType: 'Sell',
    name: '鈴木 一郎',
    status: 'Sent',
    priority: 'Mid',
    budget: 35000000,
    discountRate: 0.9,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    areas: ['世田谷区'],
    tags: ['投資用'],
    agentName: '鈴木 エージェント'
  },
  {
    id: '3',
    leadType: 'Buy',
    name: '佐藤 花子',
    status: 'Scheduled',
    priority: 'Low',
    budget: 45000000,
    discountRate: 1.0,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date().toISOString(),
    areas: ['港区'],
    tags: [],
    agentName: '佐藤 エージェント'
  },
  {
    id: '4',
    leadType: 'Buy',
    name: '高橋 健一',
    status: 'Viewed',
    priority: 'High',
    budget: 60000000,
    discountRate: 1.0,
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    updatedAt: new Date().toISOString(),
    areas: ['品川区'],
    tags: ['ペット可'],
    agentName: '田中 エージェント'
  },
  {
    id: '5',
    leadType: 'Sell',
    name: '伊藤 美咲',
    status: 'Negotiating',
    priority: 'High',
    budget: 80000000,
    discountRate: 0.95,
    createdAt: new Date(Date.now() - 345600000).toISOString(),
    updatedAt: new Date().toISOString(),
    areas: ['中央区'],
    tags: ['VIP'],
    agentName: '佐藤 エージェント'
  },
  {
    id: '6',
    leadType: 'Buy',
    name: '渡辺 謙',
    status: 'Closed',
    priority: 'Mid',
    budget: 42000000,
    discountRate: 1.0,
    createdAt: new Date(Date.now() - 432000000).toISOString(),
    updatedAt: new Date().toISOString(),
    areas: ['新宿区'],
    tags: [],
    agentName: '鈴木 エージェント'
  },
  {
    id: '7',
    leadType: 'Buy',
    name: '山本 太郎',
    status: 'New',
    priority: 'Low',
    budget: 30000000,
    discountRate: 1.0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    areas: ['練馬区'],
    tags: [],
    agentName: '田中 エージェント'
  },
  {
    id: '8',
    leadType: 'Sell',
    name: '中村 次郎',
    status: 'Sent',
    priority: 'Mid',
    budget: 55000000,
    discountRate: 1.0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    areas: ['杉並区'],
    tags: [],
    agentName: '佐藤 エージェント'
  },
  {
    id: '9',
    leadType: 'Buy',
    name: '小林 三郎',
    status: 'Scheduled',
    priority: 'High',
    budget: 70000000,
    discountRate: 0.9,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    areas: ['世田谷区'],
    tags: ['急ぎ'],
    agentName: '鈴木 エージェント'
  },
  {
    id: '10',
    leadType: 'Buy',
    name: '加藤 四郎',
    status: 'Negotiating',
    priority: 'Mid',
    budget: 48000000,
    discountRate: 1.0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    areas: ['中野区'],
    tags: [],
    agentName: '田中 エージェント'
  },
  {
    id: '11',
    leadType: 'Buy',
    name: '山田 五郎',
    status: 'New',
    priority: 'High',
    budget: 90000000,
    discountRate: 0.95,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    areas: ['渋谷区', '港区'],
    tags: ['法人', 'VIP'],
    agentName: '佐藤 エージェント'
  },
  {
    id: '12',
    leadType: 'Sell',
    name: '佐々木 六郎',
    status: 'Scheduled',
    priority: 'Low',
    budget: 28000000,
    discountRate: 1.0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    areas: ['足立区'],
    tags: [],
    agentName: '鈴木 エージェント'
  }
];
