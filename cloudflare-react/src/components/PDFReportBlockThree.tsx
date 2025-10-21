import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font } from '@react-pdf/renderer';
import { useAppSelector } from '@/redux/hooks';
import { selectCalculatedRoads, selectHasCalculatedData } from '@/store/roadDataSlice';

interface PDFReportBlockThreeProps {
  className?: string;
}

const WORK_TYPE_NAMES: Record<string, string> = {
  current_repair: 'Поточний ремонт',
  capital_repair: 'Капітальний ремонт',
  reconstruction: 'Реконструкція',
  no_work_needed: 'Не потрібно',
  '': '-'
};

const PDFReportBlockThree: React.FC<PDFReportBlockThreeProps> = ({ className }) => {
  // Получаем данные из Redux store с защитой от ошибок
  const calculatedRoads = useAppSelector((state) => {
    try {
      const roads = selectCalculatedRoads(state);
      // Проверяем что это массив
      if (!Array.isArray(roads)) {
        console.warn('calculatedRoads is not an array:', roads);
        return [];
      }
      return roads;
    } catch (error) {
      console.error('Error reading calculatedRoads:', error);
      return [];
    }
  });
  
  const hasCalculatedData = useAppSelector((state) => {
    try {
      return selectHasCalculatedData(state);
    } catch (error) {
      console.error('Error reading hasCalculatedData:', error);
      return false;
    }
  });
  
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
      borderBottomColor: '#1abc9c',
      paddingBottom: 15
    },
    sectionTitle: { 
      fontSize: 16, 
      marginTop: 20, 
      marginBottom: 15, 
      fontWeight: 600, 
      color: '#2c3e50',
      borderLeftWidth: 4,
      borderLeftColor: '#f39c12',
      paddingLeft: 12
    },
    subSectionTitle: {
      fontSize: 12,
      marginTop: 10,
      marginBottom: 8,
      fontWeight: 500,
      color: '#34495e'
    },
    table: {
      width: '100%',
      marginBottom: 20,
      borderStyle: 'solid',
      borderWidth: 2,
      borderColor: '#1abc9c',
      borderRadius: 8
    },
    tableHeader: {
      backgroundColor: '#f8f9fa',
      color: '#2c3e50',
      fontWeight: 600,
      fontSize: 12,
      borderBottomWidth: 2,
      borderBottomColor: '#1abc9c'
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

  // Подготавливаем данные для отчета
  const totalRoads = calculatedRoads.length;
  const totalLength = calculatedRoads.reduce((sum, road) => sum + road.length, 0);
  
  const workTypeStats = calculatedRoads.reduce((stats, road) => {
    const workType = road.workType || 'no_work_needed';
    stats[workType] = (stats[workType] || 0) + 1;
    return stats;
  }, {} as Record<string, number>);

  const ReportDocument = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Звіт з оцінки транспортно-експлуатаційного стану доріг</Text>
        
        {/* Загальна інформація */}
        <Text style={styles.sectionTitle}>Загальна інформація</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCellHeader}>Показник</Text>
            <Text style={styles.tableCellHeader}>Значення</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowEven]}>
            <Text style={styles.tableCell}>Кількість оцінених доріг</Text>
            <Text style={styles.tableCell}>{totalRoads} од.</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowOdd]}>
            <Text style={styles.tableCell}>Загальна протяжність</Text>
            <Text style={styles.tableCell}>{totalLength.toFixed(2)} км</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowEven]}>
            <Text style={styles.tableCell}>Статус даних</Text>
            <Text style={styles.tableCell}>
              {hasCalculatedData ? 'Дані збережено в системі' : 'Дані не збережено'}
            </Text>
          </View>
        </View>

        {/* Розподіл за видами робіт */}
        {totalRoads > 0 && (
          <>
            <Text style={styles.sectionTitle}>Розподіл за видами робіт</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={styles.tableCellHeader}>Вид робіт</Text>
                <Text style={styles.tableCellHeader}>Кількість доріг</Text>
              </View>
              {Object.entries(workTypeStats).map(([workType, count], index) => (
                <View key={workType} style={[styles.tableRow, index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}>
                  <Text style={styles.tableCell}>{WORK_TYPE_NAMES[workType] || workType}</Text>
                  <Text style={styles.tableCell}>
                    {count} ({((count / totalRoads) * 100).toFixed(1)}%)
                  </Text>
                </View>
              ))}
            </View>

            {/* Детальна інформація по кожній дорозі */}
            <Text style={styles.sectionTitle}>Детальні дані по дорогах</Text>
            {calculatedRoads.map((road, roadIndex) => (
              <View key={road.id} style={{ marginBottom: 15 }}>
                <Text style={styles.subSectionTitle}>
                  {roadIndex + 1}. {road.roadName} (Категорія {road.category}, {road.length} км)
                </Text>
                
                {/* Вихідні дані */}
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={styles.tableCellHeader}>Вихідні дані</Text>
                    <Text style={styles.tableCellHeader}>Значення</Text>
                  </View>
                  <View style={[styles.tableRow, styles.tableRowEven]}>
                    <Text style={styles.tableCell}>Інтенсивність руху</Text>
                    <Text style={styles.tableCell}>{road.actualIntensity} авт./добу</Text>
                  </View>
                  <View style={[styles.tableRow, styles.tableRowOdd]}>
                    <Text style={styles.tableCell}>Модуль пружності</Text>
                    <Text style={styles.tableCell}>{road.actualElasticModulus} МПа</Text>
                  </View>
                  <View style={[styles.tableRow, styles.tableRowEven]}>
                    <Text style={styles.tableCell}>Рівність покриття</Text>
                    <Text style={styles.tableCell}>{road.actualSurfaceEvenness} м/км</Text>
                  </View>
                  <View style={[styles.tableRow, styles.tableRowOdd]}>
                    <Text style={styles.tableCell}>Глибина колії</Text>
                    <Text style={styles.tableCell}>{road.actualRutDepth} мм</Text>
                  </View>
                  <View style={[styles.tableRow, styles.tableRowEven]}>
                    <Text style={styles.tableCell}>Коефіцієнт зчеплення</Text>
                    <Text style={styles.tableCell}>{road.actualFrictionValue}</Text>
                  </View>
                </View>

                {/* Розраховані коефіцієнти */}
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={styles.tableCellHeader}>Розраховані коефіцієнти</Text>
                    <Text style={styles.tableCellHeader}>Значення</Text>
                  </View>
                  <View style={[styles.tableRow, styles.tableRowEven]}>
                    <Text style={styles.tableCell}>Коеф. інтенсивності</Text>
                    <Text style={styles.tableCell}>
                      {road.detailedCondition.intensityCoefficient.toFixed(3)} 
                      {road.detailedCondition.intensityCoefficient >= 1.0 ? ' ✓' : ' ✗'}
                    </Text>
                  </View>
                  <View style={[styles.tableRow, styles.tableRowOdd]}>
                    <Text style={styles.tableCell}>Коеф. міцності</Text>
                    <Text style={styles.tableCell}>
                      {road.detailedCondition.strengthCoefficient.toFixed(3)}
                      {road.detailedCondition.strengthCoefficient >= 0.85 ? ' ✓' : ' ✗'}
                    </Text>
                  </View>
                  <View style={[styles.tableRow, styles.tableRowEven]}>
                    <Text style={styles.tableCell}>Коеф. рівності</Text>
                    <Text style={styles.tableCell}>
                      {road.detailedCondition.evennessCoefficient.toFixed(3)}
                      {road.detailedCondition.evennessCoefficient >= 1.0 ? ' ✓' : ' ✗'}
                    </Text>
                  </View>
                  <View style={[styles.tableRow, styles.tableRowOdd]}>
                    <Text style={styles.tableCell}>Коеф. колійності</Text>
                    <Text style={styles.tableCell}>
                      {road.detailedCondition.rutCoefficient.toFixed(3)}
                      {road.detailedCondition.rutCoefficient >= 1.0 ? ' ✓' : ' ✗'}
                    </Text>
                  </View>
                  <View style={[styles.tableRow, styles.tableRowEven]}>
                    <Text style={styles.tableCell}>Коеф. зчеплення</Text>
                    <Text style={styles.tableCell}>
                      {road.detailedCondition.frictionCoefficient.toFixed(3)}
                      {road.detailedCondition.frictionCoefficient >= 1.0 ? ' ✓' : ' ✗'}
                    </Text>
                  </View>
                </View>

                {/* Висновок */}
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={styles.tableCellHeader}>Висновок</Text>
                    <Text style={styles.tableCellHeader}>Значення</Text>
                  </View>
                  <View style={[styles.tableRow, styles.tableRowEven]}>
                    <Text style={styles.tableCell}>Рекомендований вид робіт</Text>
                    <Text style={styles.tableCell}>{WORK_TYPE_NAMES[road.workType] || road.workType}</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {!hasCalculatedData && (
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableRowEven]}>
              <Text style={[styles.tableCell, { width: '100%', textAlign: 'center', color: '#e74c3c' }]}>
                Немає даних для відображення. Виконайте розрахунки в розділі "Блок 3".
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.footer}>{`Звіт згенеровано: ${new Date().toLocaleString('uk-UA')}`}</Text>
      </Page>
    </Document>
  );

  // Если данных нет или они невалидны - показываем кнопку но отключаем её
  if (!hasCalculatedData || !Array.isArray(calculatedRoads) || calculatedRoads.length === 0) {
    return (
      <Button className={className} disabled>
        <Download className="mr-2 h-4 w-4" /> Немає даних для звіту
      </Button>
    );
  }

  try {
    return (
      <PDFDownloadLink
        document={ReportDocument}
        fileName={`звіт_оцінка_доріг_${new Date().toLocaleDateString('uk-UA').replace(/\./g, '_')}.pdf`}
      >
        {({ loading }) => (
          <Button className={className}>
            <Download className="mr-2 h-4 w-4" /> {loading ? 'Генеруємо...' : 'Завантажити PDF звіт'}
          </Button>
        )}
      </PDFDownloadLink>
    );
  } catch (error) {
    console.error('Error rendering PDFDownloadLink:', error);
    return (
      <Button className={className} disabled>
        <Download className="mr-2 h-4 w-4" /> Помилка генерації PDF
      </Button>
    );
  }
};

export default PDFReportBlockThree;