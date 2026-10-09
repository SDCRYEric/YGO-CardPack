// src/data/categories.ts
export const categories = {
  byEra: {
    '经典时代 (1999-2002)': ['1999', '2000', '2001', '2002'],
    '决斗城市时代 (2003-2005)': ['2003', '2004', '2005'],
    'GX 时代 (2006-2007)': ['2006', '2007'],
    "5D's 时代 (2008-2010)": ['2008', '2009', '2010'],
    'ZEXAL 时代 (2011-2013)': ['2011', '2012', '2013'],
    'ARC-V 时代 (2014-2016)': ['2014', '2015', '2016'],
    'VRAINS 时代 (2017-2019)': ['2017', '2018', '2019'],
    'SEVENS / GO RUSH 时代 (2020+)': ['2020', '2021', '2022', '2023', '2024', '2025', '2026'],
  },
  byType: {
    '补充包': ['Booster Pack', 'Booster'],
    '起始卡组': ['Starter Deck'],
    '主题卡组': ['Structure Deck'],
    '其他': [],
  }
};

// 根据发售日期判断动漫世代
export function getGeneration(releaseDate: string): string {
  if (!releaseDate) return '未知';
  const year = parseInt(releaseDate.substring(0, 4));
  if (year <= 2004) return '决斗怪兽 (DM)';
  if (year <= 2007) return 'GX';
  if (year <= 2010) return "5D's";
  if (year <= 2013) return 'ZEXAL';
  if (year <= 2016) return 'ARC-V';
  if (year <= 2019) return 'VRAINS';
  if (year <= 2022) return 'SEVENS';
  return 'GO RUSH';
}

// 根据发售日期判断大师规则版本
export function getMasterRule(releaseDate: string): string {
  if (!releaseDate) return '未知';
  const [yearStr, monthStr] = releaseDate.split('-');
  const year = parseInt(yearStr);
  const month = parseInt(monthStr || '1');

  if (year < 2008 || (year === 2008 && month < 3)) return '旧规则（大师规则前）';
  if (year < 2014 || (year === 2014 && month < 3)) return '大师规则 1';
  if (year < 2017 || (year === 2017 && month < 3)) return '大师规则 2';
  if (year < 2020 || (year === 2020 && month < 4)) return '大师规则 3';
  return '大师规则 4 (新大师规则)';
}