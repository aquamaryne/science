import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font } from '@react-pdf/renderer';
import { useAppSelector } from '@/redux/hooks';
import { selectCalculatedRoads, selectHasCalculatedData } from '@/store/roadDataSlice';

interface PDFReportBlockThreeProps {
  className?: string;
}

const PDFReportBlockThree: React.FC<PDFReportBlockThreeProps> = ({ className }) => {
  // Получаем данные из Redux store
  const calculatedRoads = useAppSelector(selectCalculatedRoads);
  const hasCalculatedData = useAppSelector(selectHasCalculatedData);
  
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
    dataTable: {
      width: '100%',
      marginBottom: 20,
      borderStyle: 'solid',
      borderWidth: 1,
      borderColor: '#34495e',
      borderRadius: 4
    },
    dataTableHeader: {
      backgroundColor: '#ecf0f1',
      color: '#2c3e50',
      fontWeight: 600,
      fontSize: 9,
      borderBottomWidth: 1,
      borderBottomColor: '#bdc3c7'
    },
    dataTableCell: {
      padding: 6,
      fontSize: 8,
      borderRightWidth: 1,
      borderRightColor: '#bdc3c7',
      color: '#2c3e50',
      textAlign: 'left'
    },
    dataTableCellNumber: {
      padding: 6,
      fontSize: 8,
      borderRightWidth: 1,
      borderRightColor: '#bdc3c7',
      color: '#2c3e50',
      textAlign: 'right'
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
      borderColor: '#8e44ad',
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
    bullet: {
      fontSize: 12,
      marginBottom: 6,
      color: '#2c3e50',
      paddingLeft: 15
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
  const totalCost = calculatedRoads.reduce((sum, road) => sum + (road.estimatedCost || 0), 0);
  
  const workTypeStats = calculatedRoads.reduce((stats, road) => {
    const workType = road.workType || 'Не визначено';
    stats[workType] = (stats[workType] || 0) + 1;
    return stats;
  }, {} as Record<string, number>);

  const ReportDocument = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Звіт з планування ремонтів автомобільних доріг</Text>
        
        <Text style={styles.sectionTitle}>Інформація про розрахунки</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCellHeader}>Показник</Text>
            <Text style={styles.tableCellHeader}>Статус</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowEven]}>
            <Text style={styles.tableCell}>Збереження даних</Text>
            <Text style={styles.tableCell}>
              {hasCalculatedData ? 'Дані збережено в системі' : 'Дані не збережено'}
            </Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowOdd]}>
            <Text style={styles.tableCell}>Розрахунки ефективності</Text>
            <Text style={styles.tableCell}>
              {totalRoads > 0 ? `Розрахунки виконано для ${totalRoads} доріг` : 'Розрахунки не виконано'}
            </Text>
          </View>
        </View>

        {totalRoads > 0 && (
          <>
            <Text style={styles.sectionTitle}>Загальна статистика</Text>
            <View style={styles.dataTable}>
              <View style={[styles.tableRow, styles.dataTableHeader]}>
                <Text style={[styles.dataTableCell, { width: '40%' }]}>Показник</Text>
                <Text style={[styles.dataTableCellNumber, { width: '30%' }]}>Значення</Text>
                <Text style={[styles.dataTableCell, { width: '30%' }]}>Одиниця</Text>
              </View>
              <View style={[styles.tableRow, styles.tableRowEven]}>
                <Text style={[styles.dataTableCell, { width: '40%' }]}>Кількість доріг</Text>
                <Text style={[styles.dataTableCellNumber, { width: '30%' }]}>{totalRoads}</Text>
                <Text style={[styles.dataTableCell, { width: '30%' }]}>од.</Text>
              </View>
              <View style={[styles.tableRow, styles.tableRowOdd]}>
                <Text style={[styles.dataTableCell, { width: '40%' }]}>Загальна протяжність</Text>
                <Text style={[styles.dataTableCellNumber, { width: '30%' }]}>{totalLength.toFixed(2)}</Text>
                <Text style={[styles.dataTableCell, { width: '30%' }]}>км</Text>
              </View>
              <View style={[styles.tableRow, styles.tableRowEven]}>
                <Text style={[styles.dataTableCell, { width: '40%' }]}>Загальна вартість</Text>
                <Text style={[styles.dataTableCellNumber, { width: '30%' }]}>{totalCost.toLocaleString('uk-UA')}</Text>
                <Text style={[styles.dataTableCell, { width: '30%' }]}>грн</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Розподіл за видами робіт</Text>
            <View style={styles.dataTable}>
              <View style={[styles.tableRow, styles.dataTableHeader]}>
                <Text style={[styles.dataTableCell, { width: '60%' }]}>Вид робіт</Text>
                <Text style={[styles.dataTableCellNumber, { width: '20%' }]}>Кількість</Text>
                <Text style={[styles.dataTableCellNumber, { width: '20%' }]}>%</Text>
              </View>
              {Object.entries(workTypeStats).map(([workType, count], index) => (
                <View key={workType} style={[styles.tableRow, index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}>
                  <Text style={[styles.dataTableCell, { width: '60%' }]}>{workType}</Text>
                  <Text style={[styles.dataTableCellNumber, { width: '20%' }]}>{count}</Text>
                  <Text style={[styles.dataTableCellNumber, { width: '20%' }]}>
                    {((count / totalRoads) * 100).toFixed(1)}%
                  </Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Детальні дані по дорогах</Text>
            <View style={styles.dataTable}>
              <View style={[styles.tableRow, styles.dataTableHeader]}>
                <Text style={[styles.dataTableCell, { width: '25%' }]}>Назва дороги</Text>
                <Text style={[styles.dataTableCellNumber, { width: '10%' }]}>Кат.</Text>
                <Text style={[styles.dataTableCellNumber, { width: '15%' }]}>Довжина</Text>
                <Text style={[styles.dataTableCell, { width: '25%' }]}>Вид робіт</Text>
                <Text style={[styles.dataTableCellNumber, { width: '25%' }]}>Вартість</Text>
              </View>
              {calculatedRoads.slice(0, 10).map((road, index) => (
                <View key={road.id} style={[styles.tableRow, index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}>
                  <Text style={[styles.dataTableCell, { width: '25%' }]}>{road.roadName}</Text>
                  <Text style={[styles.dataTableCellNumber, { width: '10%' }]}>{road.category}</Text>
                  <Text style={[styles.dataTableCellNumber, { width: '15%' }]}>{road.length.toFixed(2)}</Text>
                  <Text style={[styles.dataTableCell, { width: '25%' }]}>{road.workType || 'Не визначено'}</Text>
                  <Text style={[styles.dataTableCellNumber, { width: '25%' }]}>
                    {(road.estimatedCost || 0).toLocaleString('uk-UA')}
                  </Text>
                </View>
              ))}
              {calculatedRoads.length > 10 && (
                <View style={[styles.tableRow, styles.tableRowEven]}>
                  <Text style={[styles.dataTableCell, { width: '100%', textAlign: 'center' }]}>
                    ... та ще {calculatedRoads.length - 10} доріг
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.bullet}>
            • {hasCalculatedData ? 'Аналіз економічної ефективності завершено' : 'Аналіз не виконано - немає даних'}
          </Text>
          <Text style={styles.bullet}>
            • {totalRoads > 0 ? `Розрахунки показників ефективності виконано для ${totalRoads} доріг` : 'Розрахунки не виконано'}
          </Text>
          <Text style={styles.bullet}>
            • {hasCalculatedData ? 'Результати збережено в базі даних' : 'Результати не збережено'}
          </Text>
        </View>

        <Text style={styles.footer}>{`Звіт згенеровано: ${new Date().toLocaleString('uk-UA')}`}</Text>
      </Page>
    </Document>
  );

  return (
    <PDFDownloadLink
      document={ReportDocument}
      fileName={`звіт_планування_ремонтів_${new Date().toLocaleDateString('uk-UA').replace(/\./g, '_')}.pdf`}
    >
      {({ loading }) => (
        <Button className={className}>
          <Download className="mr-2 h-4 w-4" /> {loading ? 'Генеруємо...' : 'Завантажити PDF звіт'}
        </Button>
      )}
    </PDFDownloadLink>
  );
};

export default PDFReportBlockThree;