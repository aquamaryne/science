import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font } from '@react-pdf/renderer';
import { useAppSelector } from '../redux/hooks';

interface PDFReportBlockTwoProps {
  className?: string;
}

const PDFReportBlockTwo: React.FC<PDFReportBlockTwoProps> = ({ className }) => {
  // Читаем данные из Redux
  const blockTwoState = useAppSelector(state => state.blockTwo);
  const currentSession = useAppSelector(state => state.history.currentSession);
  const blockTwoData = currentSession?.blockTwoData;
  
  // Проверяем наличие региональных результатов (из blockTwo state ИЛИ из истории)
  const allRegionalResults: any[] = blockTwoState?.regionalResults || blockTwoData?.regionalResults || [];
  const selectedRegion = blockTwoState?.selectedRegion || blockTwoData?.selectedRegion || 'all';
  const roadType = blockTwoState?.regionalResultsRoadType || blockTwoData?.roadType || null;
  const roadTypeLabel = roadType === 'state' ? 'ДЕРЖАВНИХ' : roadType === 'local' ? 'МІСЦЕВИХ' : '';
  
  console.log('📊 PDF Debug:', {
    hasBlockTwoState: !!blockTwoState,
    stateRoadBaseRate: blockTwoState?.stateRoadBaseRate,
    localRoadBaseRate: blockTwoState?.localRoadBaseRate,
    hasBlockTwoData: !!blockTwoData,
    allRegionalResultsCount: allRegionalResults.length,
    selectedRegion,
    roadType
  });
  
  // Фильтруем результаты по выбранной области
  const regionalResults: any[] = selectedRegion === 'all' || selectedRegion === 'Україна'
    ? allRegionalResults
    : allRegionalResults.filter((result: any) => result.regionName === selectedRegion);
  
  const hasRegionalResults = Boolean(regionalResults.length > 0);
  
  // Register a font that supports Cyrillic (Ukrainian)
  Font.register({
    family: 'Roboto',
    fonts: [
      {
        src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf',
        fontWeight: 300,
      },
      {
        src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
        fontWeight: 400,
      },
      {
        src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf',
        fontWeight: 500,
      },
      {
        src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
        fontWeight: 700,
      },
    ]
  });

  const styles = StyleSheet.create({
    page: { padding: 30, fontFamily: 'Roboto', backgroundColor: '#ffffff' },
    title: { 
      fontSize: 22, 
      textAlign: 'center', 
      marginBottom: 30, 
      fontWeight: 700, 
      color: '#2c3e50',
      borderBottomWidth: 4,
      borderBottomColor: '#9b59b6',
      paddingBottom: 15
    },
    sectionTitle: { 
      fontSize: 16, 
      marginTop: 20, 
      marginBottom: 15, 
      fontWeight: 600, 
      color: '#2c3e50',
      borderLeftWidth: 4,
      borderLeftColor: '#e67e22',
      paddingLeft: 12
    },
    table: {
      width: '100%',
      marginBottom: 20,
      borderStyle: 'solid',
      borderWidth: 2,
      borderColor: '#9b59b6',
      borderRadius: 8
    },
    tableHeader: {
      backgroundColor: '#f8f9fa',
      color: '#2c3e50',
      fontWeight: 600,
      fontSize: 12,
      borderBottomWidth: 2,
      borderBottomColor: '#9b59b6'
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#bdc3c7',
      minHeight: 35,
      width: '100%'
    },
    tableRowEven: {
      backgroundColor: '#ffffff'
    },
    tableRowOdd: {
      backgroundColor: '#f8f9fa'
    },
    tableCell: {
      width: '50%',
      padding: 10,
      fontSize: 10,
      borderRightWidth: 1,
      borderRightColor: '#bdc3c7',
      color: '#2c3e50',
      textAlign: 'left'
    },
    tableCellHeader: {
      width: '50%',
      padding: 10,
      fontSize: 11,
      fontWeight: 600,
      color: '#2c3e50',
      borderRightWidth: 1,
      borderRightColor: '#bdc3c7',
      textAlign: 'left'
    },
    infoSection: {
      borderWidth: 2,
      borderColor: '#16a085',
      borderStyle: 'solid',
      padding: 15,
      borderRadius: 8,
      marginTop: 20,
      backgroundColor: '#ffffff'
    },
    infoItem: {
      fontSize: 12,
      marginBottom: 6,
      color: '#2c3e50'
    },
    footer: { 
      fontSize: 10, 
      textAlign: 'center', 
      marginTop: 30,
      color: '#7f8c8d',
      borderTopWidth: 1,
      borderTopColor: '#bdc3c7',
      paddingTop: 15
    }
  });

  let ReportDocument;
  
  try {
    ReportDocument = (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.title}>
            Звіт з експлуатаційного утримання доріг
            {selectedRegion !== 'all' && selectedRegion !== 'Україна' && ` (${selectedRegion} область)`}
          </Text>
        
        {/* Блок 2.1: Державні дороги */}
        <Text style={styles.sectionTitle}>Дороги державного значення</Text>
        
        {/* Базові показники */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCellHeader}>Показник</Text>
            <Text style={styles.tableCellHeader}>Значення</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowEven]}>
            <Text style={styles.tableCell}>Базовий норматив</Text>
            <Text style={styles.tableCell}>{(blockTwoState?.stateRoadBaseRate || 0).toFixed(3)} тис. грн/км</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowOdd]}>
            <Text style={styles.tableCell}>Індекси інфляції</Text>
            <Text style={styles.tableCell}>{(blockTwoState?.stateInflationIndexes || []).join('%, ')}%</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowEven]}>
            <Text style={styles.tableCell}>Сукупний індекс інфляції</Text>
            <Text style={styles.tableCell}>
              {(blockTwoState?.stateInflationIndexes || [10]).reduce((acc, curr) => acc * (1 + curr / 100), 1).toFixed(4)}
            </Text>
          </View>
        </View>

        {/* Нормативи по категоріях */}
        <Text style={{ ...styles.sectionTitle, fontSize: 12, marginTop: 15 }}>Нормативи по категоріях доріг</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCellHeader}>Категорія</Text>
            <Text style={styles.tableCellHeader}>Норматив (тис. грн/км)</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowEven]}>
            <Text style={styles.tableCell}>I</Text>
            <Text style={styles.tableCell}>{(blockTwoState?.stateRoadRates?.category1 || 0).toFixed(2)}</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowOdd]}>
            <Text style={styles.tableCell}>II</Text>
            <Text style={styles.tableCell}>{(blockTwoState?.stateRoadRates?.category2 || 0).toFixed(2)}</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowEven]}>
            <Text style={styles.tableCell}>III</Text>
            <Text style={styles.tableCell}>{(blockTwoState?.stateRoadRates?.category3 || 0).toFixed(2)}</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowOdd]}>
            <Text style={styles.tableCell}>IV</Text>
            <Text style={styles.tableCell}>{(blockTwoState?.stateRoadRates?.category4 || 0).toFixed(2)}</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowEven]}>
            <Text style={styles.tableCell}>V</Text>
            <Text style={styles.tableCell}>{(blockTwoState?.stateRoadRates?.category5 || 0).toFixed(2)}</Text>
          </View>
        </View>

        {/* Блок 2.2: Місцеві дороги */}
        <Text style={styles.sectionTitle}>Дороги місцевого значення</Text>
        
        {/* Базові показники */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCellHeader}>Показник</Text>
            <Text style={styles.tableCellHeader}>Значення</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowEven]}>
            <Text style={styles.tableCell}>Базовий норматив</Text>
            <Text style={styles.tableCell}>{(blockTwoState?.localRoadBaseRate || 0).toFixed(3)} тис. грн/км</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowOdd]}>
            <Text style={styles.tableCell}>Індекси інфляції</Text>
            <Text style={styles.tableCell}>{(blockTwoState?.localInflationIndexes || []).join('%, ')}%</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowEven]}>
            <Text style={styles.tableCell}>Сукупний індекс інфляції</Text>
            <Text style={styles.tableCell}>
              {(blockTwoState?.localInflationIndexes || [10]).reduce((acc, curr) => acc * (1 + curr / 100), 1).toFixed(4)}
            </Text>
          </View>
        </View>

        {/* Нормативи по категоріях */}
        <Text style={{ ...styles.sectionTitle, fontSize: 12, marginTop: 15 }}>Нормативи по категоріях доріг</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCellHeader}>Категорія</Text>
            <Text style={styles.tableCellHeader}>Норматив (тис. грн/км)</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowEven]}>
            <Text style={styles.tableCell}>I</Text>
            <Text style={styles.tableCell}>{(blockTwoState?.localRoadRates?.category1 || 0).toFixed(2)}</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowOdd]}>
            <Text style={styles.tableCell}>II</Text>
            <Text style={styles.tableCell}>{(blockTwoState?.localRoadRates?.category2 || 0).toFixed(2)}</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowEven]}>
            <Text style={styles.tableCell}>III</Text>
            <Text style={styles.tableCell}>{(blockTwoState?.localRoadRates?.category3 || 0).toFixed(2)}</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowOdd]}>
            <Text style={styles.tableCell}>IV</Text>
            <Text style={styles.tableCell}>{(blockTwoState?.localRoadRates?.category4 || 0).toFixed(2)}</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowEven]}>
            <Text style={styles.tableCell}>V</Text>
            <Text style={styles.tableCell}>{(blockTwoState?.localRoadRates?.category5 || 0).toFixed(2)}</Text>
          </View>
        </View>

        {/* Результати фінансування (якщо є) */}
        {blockTwoState?.fundingResults && (
          <>
            <Text style={styles.sectionTitle}>Результати розрахунку фінансування</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={styles.tableCellHeader}>Показник</Text>
                <Text style={styles.tableCellHeader}>Значення</Text>
              </View>
              <View style={[styles.tableRow, styles.tableRowEven]}>
                <Text style={styles.tableCell}>Регіон</Text>
                <Text style={styles.tableCell}>{blockTwoState?.selectedRegion || 'Не вибрано'}</Text>
              </View>
              <View style={[styles.tableRow, styles.tableRowOdd]}>
                <Text style={styles.tableCell}>Фінансування держ. доріг</Text>
                <Text style={styles.tableCell}>{(blockTwoState?.fundingResults?.stateFunding || 0).toLocaleString('uk-UA')} тис. грн</Text>
              </View>
              <View style={[styles.tableRow, styles.tableRowEven]}>
                <Text style={styles.tableCell}>Фінансування місц. доріг</Text>
                <Text style={styles.tableCell}>{(blockTwoState?.fundingResults?.localFunding || 0).toLocaleString('uk-UA')} тис. грн</Text>
              </View>
              <View style={[styles.tableRow, styles.tableRowOdd]}>
                <Text style={styles.tableCell}>Загальне фінансування</Text>
                <Text style={styles.tableCell}>{(blockTwoState?.fundingResults?.totalFunding || 0).toLocaleString('uk-UA')} тис. грн</Text>
              </View>
            </View>
          </>
        )}

        {/* Регіональні результати (якщо є) */}
        {hasRegionalResults && (
          <>
            <Text style={styles.sectionTitle}>
              Детальний розрахунок обсягу коштів{selectedRegion === 'all' || selectedRegion === 'Україна' ? ' по областях' : ` для ${selectedRegion} області`}{roadTypeLabel ? ` (дороги ${roadTypeLabel.toLowerCase()} значення)` : ''}
            </Text>
            <View style={styles.table}>
              {/* Заголовок таблиці */}
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={{ width: '25%', padding: 5, fontSize: 9, fontWeight: 600, textAlign: 'center' }}>Область</Text>
                <Text style={{ width: '10%', padding: 5, fontSize: 8, fontWeight: 600, textAlign: 'center' }}>Кат. I</Text>
                <Text style={{ width: '10%', padding: 5, fontSize: 8, fontWeight: 600, textAlign: 'center' }}>Кат. II</Text>
                <Text style={{ width: '10%', padding: 5, fontSize: 8, fontWeight: 600, textAlign: 'center' }}>Кат. III</Text>
                <Text style={{ width: '10%', padding: 5, fontSize: 8, fontWeight: 600, textAlign: 'center' }}>Кат. IV</Text>
                <Text style={{ width: '10%', padding: 5, fontSize: 8, fontWeight: 600, textAlign: 'center' }}>Кат. V</Text>
                <Text style={{ width: '25%', padding: 5, fontSize: 9, fontWeight: 600, textAlign: 'center' }}>Разом (тис. грн)</Text>
              </View>
              
              {/* Дані по областях */}
              {(regionalResults || []).map((result: any, idx: number) => (
                <View key={idx} style={[styles.tableRow, idx % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}>
                  <Text style={{ width: '25%', padding: 5, fontSize: 8, textAlign: 'left' }}>{result.regionName}</Text>
                  <Text style={{ width: '10%', padding: 5, fontSize: 7, textAlign: 'right' }}>
                    {Math.round(result.fundingByCategory[1]).toLocaleString('uk-UA')}
                  </Text>
                  <Text style={{ width: '10%', padding: 5, fontSize: 7, textAlign: 'right' }}>
                    {Math.round(result.fundingByCategory[2]).toLocaleString('uk-UA')}
                  </Text>
                  <Text style={{ width: '10%', padding: 5, fontSize: 7, textAlign: 'right' }}>
                    {Math.round(result.fundingByCategory[3]).toLocaleString('uk-UA')}
                  </Text>
                  <Text style={{ width: '10%', padding: 5, fontSize: 7, textAlign: 'right' }}>
                    {Math.round(result.fundingByCategory[4]).toLocaleString('uk-UA')}
                  </Text>
                  <Text style={{ width: '10%', padding: 5, fontSize: 7, textAlign: 'right' }}>
                    {Math.round(result.fundingByCategory[5]).toLocaleString('uk-UA')}
                  </Text>
                  <Text style={{ width: '25%', padding: 5, fontSize: 8, fontWeight: 600, textAlign: 'right' }}>
                    {Math.round(result.totalFunding).toLocaleString('uk-UA')}
                  </Text>
                </View>
              ))}
              
              {/* Підсумковий рядок */}
              <View style={[styles.tableRow, { backgroundColor: '#e8f5e9', borderTopWidth: 2, borderTopColor: '#4caf50' }]}>
                <Text style={{ width: '25%', padding: 5, fontSize: 9, fontWeight: 700, textAlign: 'left' }}>
                  {selectedRegion === 'all' || selectedRegion === 'Україна' ? 'ВСЬОГО ПО УКРАЇНІ' : `ВСЬОГО ПО ${selectedRegion.toUpperCase()}`}
                </Text>
                <Text style={{ width: '10%', padding: 5, fontSize: 8, fontWeight: 700, textAlign: 'right' }}>
                  {Math.round((regionalResults || []).reduce((sum: number, r: any) => sum + r.fundingByCategory[1], 0)).toLocaleString('uk-UA')}
                </Text>
                <Text style={{ width: '10%', padding: 5, fontSize: 8, fontWeight: 700, textAlign: 'right' }}>
                  {Math.round((regionalResults || []).reduce((sum: number, r: any) => sum + r.fundingByCategory[2], 0)).toLocaleString('uk-UA')}
                </Text>
                <Text style={{ width: '10%', padding: 5, fontSize: 8, fontWeight: 700, textAlign: 'right' }}>
                  {Math.round((regionalResults || []).reduce((sum: number, r: any) => sum + r.fundingByCategory[3], 0)).toLocaleString('uk-UA')}
                </Text>
                <Text style={{ width: '10%', padding: 5, fontSize: 8, fontWeight: 700, textAlign: 'right' }}>
                  {Math.round((regionalResults || []).reduce((sum: number, r: any) => sum + r.fundingByCategory[4], 0)).toLocaleString('uk-UA')}
                </Text>
                <Text style={{ width: '10%', padding: 5, fontSize: 8, fontWeight: 700, textAlign: 'right' }}>
                  {Math.round((regionalResults || []).reduce((sum: number, r: any) => sum + r.fundingByCategory[5], 0)).toLocaleString('uk-UA')}
                </Text>
                <Text style={{ width: '25%', padding: 5, fontSize: 9, fontWeight: 700, textAlign: 'right', color: '#2e7d32' }}>
                  {Math.round((regionalResults || []).reduce((sum: number, r: any) => sum + r.totalFunding, 0)).toLocaleString('uk-UA')}
                </Text>
              </View>
            </View>
            
            {/* Статистика по категоріях */}
            <Text style={{ ...styles.sectionTitle, fontSize: 14 }}>
              Підсумок по категоріях доріг{selectedRegion === 'all' || selectedRegion === 'Україна' ? '' : ` (${selectedRegion} область)`}
            </Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={styles.tableCellHeader}>Категорія</Text>
                <Text style={styles.tableCellHeader}>Загальне фінансування (млн. грн)</Text>
              </View>
              {[1, 2, 3, 4, 5].map((cat: number, idx: number) => {
                const total = (regionalResults || []).reduce((sum: number, r: any) => sum + r.fundingByCategory[cat], 0);
                return (
                  <View key={cat} style={[styles.tableRow, idx % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}>
                    <Text style={styles.tableCell}>Категорія {['I', 'II', 'III', 'IV', 'V'][cat - 1]}</Text>
                    <Text style={styles.tableCell}>{(total / 1000).toFixed(2)}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Таблиця коефіцієнтів (якщо є регіональні результати) */}
        {hasRegionalResults && (
          <>
            <Text style={styles.sectionTitle}>
              Середньозважені коригувальні коефіцієнти{selectedRegion === 'all' || selectedRegion === 'Україна' ? ' по областях' : ` для ${selectedRegion} області`}
            </Text>
            <View style={styles.table}>
              {/* Заголовок таблиці */}
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={{ width: roadType === 'state' ? '16%' : '25%', padding: 5, fontSize: 8, fontWeight: 600, textAlign: 'center' }}>Область</Text>
                {roadType === 'state' && (
                  <Text style={{ width: '8%', padding: 5, fontSize: 7, fontWeight: 600, textAlign: 'center' }}>Kд</Text>
                )}
                <Text style={{ width: roadType === 'state' ? '8%' : '12%', padding: 5, fontSize: 7, fontWeight: 600, textAlign: 'center' }}>Kг</Text>
                <Text style={{ width: roadType === 'state' ? '8%' : '12%', padding: 5, fontSize: 7, fontWeight: 600, textAlign: 'center' }}>Kуе</Text>
                <Text style={{ width: roadType === 'state' ? '8%' : '12%', padding: 5, fontSize: 7, fontWeight: 600, textAlign: 'center' }}>Kінт</Text>
                {roadType === 'state' && (
                  <>
                    <Text style={{ width: '8%', padding: 5, fontSize: 7, fontWeight: 600, textAlign: 'center' }}>Kе.д</Text>
                    <Text style={{ width: '8%', padding: 5, fontSize: 7, fontWeight: 600, textAlign: 'center' }}>Kмпп</Text>
                    <Text style={{ width: '8%', padding: 5, fontSize: 7, fontWeight: 600, textAlign: 'center' }}>Kосв</Text>
                    <Text style={{ width: '8%', padding: 5, fontSize: 7, fontWeight: 600, textAlign: 'center' }}>Kрем</Text>
                    <Text style={{ width: '8%', padding: 5, fontSize: 7, fontWeight: 600, textAlign: 'center' }}>Kкр.і</Text>
                  </>
                )}
                <Text style={{ width: roadType === 'state' ? '12%' : '14%', padding: 5, fontSize: 7, fontWeight: 600, textAlign: 'center' }}>Добуток</Text>
              </View>
              
              {/* Дані по областях */}
              {(regionalResults || []).map((result: any, idx: number) => (
                <View key={idx} style={[styles.tableRow, idx % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}>
                  <Text style={{ width: roadType === 'state' ? '16%' : '25%', padding: 4, fontSize: 7, textAlign: 'left' }}>{result.regionName}</Text>
                  {roadType === 'state' && (
                    <Text style={{ width: '8%', padding: 4, fontSize: 6, textAlign: 'center' }}>1.1600</Text>
                  )}
                  <Text style={{ width: roadType === 'state' ? '8%' : '12%', padding: 4, fontSize: 6, textAlign: 'center' }}>
                    {result.coefficients?.mountainous?.toFixed(4) || '1.0000'}
                  </Text>
                  <Text style={{ width: roadType === 'state' ? '8%' : '12%', padding: 4, fontSize: 6, textAlign: 'center' }}>
                    {result.coefficients?.operatingConditions?.toFixed(4) || '1.0000'}
                  </Text>
                  <Text style={{ width: roadType === 'state' ? '8%' : '12%', padding: 4, fontSize: 6, textAlign: 'center' }}>
                    {result.coefficients?.trafficIntensity?.toFixed(4) || '1.0000'}
                  </Text>
                  {roadType === 'state' && (
                    <>
                      <Text style={{ width: '8%', padding: 4, fontSize: 6, textAlign: 'center' }}>
                        {(result.coefficients?.europeanRoad || 1).toFixed(4)}
                      </Text>
                      <Text style={{ width: '8%', padding: 4, fontSize: 6, textAlign: 'center' }}>
                        {(result.coefficients?.borderCrossing || 1).toFixed(4)}
                      </Text>
                      <Text style={{ width: '8%', padding: 4, fontSize: 6, textAlign: 'center' }}>
                        {(result.coefficients?.lighting || 1).toFixed(4)}
                      </Text>
                      <Text style={{ width: '8%', padding: 4, fontSize: 6, textAlign: 'center' }}>
                        {(result.coefficients?.repair || 1).toFixed(4)}
                      </Text>
                      <Text style={{ width: '8%', padding: 4, fontSize: 6, textAlign: 'center' }}>
                        {(result.coefficients?.criticalInfra || 1).toFixed(4)}
                      </Text>
                    </>
                  )}
                  <Text style={{ width: roadType === 'state' ? '12%' : '14%', padding: 4, fontSize: 7, fontWeight: 600, textAlign: 'center' }}>
                    {result.coefficients?.totalProduct?.toFixed(4) || '1.0000'}
                  </Text>
                </View>
              ))}
            </View>

            {/* Пояснення коефіцієнтів */}
            <View style={styles.infoSection}>
              <Text style={{ ...styles.infoItem, fontWeight: 600, marginBottom: 10, fontSize: 11 }}>Позначення коефіцієнтів:</Text>
              {roadType === 'state' && (
                <Text style={styles.infoItem}>• Kд - коефіцієнт обслуговування державних доріг (1.16)</Text>
              )}
              <Text style={styles.infoItem}>• Kг - коефіцієнт гірської місцевості</Text>
              <Text style={styles.infoItem}>• Kуе - коефіцієнт умов експлуатації</Text>
              <Text style={styles.infoItem}>• Kінт - коефіцієнт інтенсивності руху</Text>
              {roadType === 'state' && (
                <>
                  <Text style={styles.infoItem}>• Kе.д - коефіцієнт європейської мережі</Text>
                  <Text style={styles.infoItem}>• Kмпп - коефіцієнт міжнародних пунктів пропуску</Text>
                  <Text style={styles.infoItem}>• Kосв - коефіцієнт освітлення доріг</Text>
                  <Text style={styles.infoItem}>• Kрем - коефіцієнт нещодавно відремонтованих</Text>
                  <Text style={styles.infoItem}>• Kкр.і - коефіцієнт критичної інфраструктури</Text>
                </>
              )}
            </View>
          </>
        )}

        <Text style={styles.footer}>{`Звіт згенеровано: ${new Date().toLocaleString('uk-UA')}`}</Text>
      </Page>
    </Document>
    );
  } catch (error) {
    console.error('PDF Error:', error);
    ReportDocument = (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.title}>Помилка генерації звіту</Text>
          <Text style={{ fontSize: 12, marginTop: 20 }}>
            Не вдалося створити PDF документ. Спробуйте виконати розрахунки знову.
          </Text>
        </Page>
      </Document>
    );
  }

  // Проверяем наличие базовых данных
  const hasBaseData = blockTwoState && 
                      blockTwoState.stateRoadBaseRate > 0 && 
                      blockTwoState.localRoadBaseRate > 0;

  if (!hasBaseData) {
    return (
      <Button className={className} disabled>
        <Download className="mr-2 h-4 w-4" /> 
        Спочатку виконайте розрахунки
      </Button>
    );
  }

  const fileName = selectedRegion === 'all' || selectedRegion === 'Україна'
    ? `звіт_експлуатаційне_утримання_${new Date().toLocaleDateString('uk-UA').replace(/\./g, '_')}.pdf`
    : `звіт_експлуатаційне_утримання_${selectedRegion}_${new Date().toLocaleDateString('uk-UA').replace(/\./g, '_')}.pdf`;

  return (
    <PDFDownloadLink
      document={ReportDocument}
      fileName={fileName}
    >
      {({ loading, error }) => {
        if (error) {
          console.error('PDF Error:', error);
          return (
            <Button className={className} disabled>
              <Download className="mr-2 h-4 w-4" /> 
              Помилка генерації PDF
            </Button>
          );
        }
        
        return (
          <Button className={className}>
            <Download className="mr-2 h-4 w-4" /> 
            {loading ? 'Генеруємо...' : 'Завантажити PDF звіт'}
          </Button>
        );
      }}
    </PDFDownloadLink>
  );
};

export default PDFReportBlockTwo;