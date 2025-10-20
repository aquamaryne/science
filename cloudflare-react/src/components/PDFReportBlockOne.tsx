import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useAppSelector } from '@/redux/hooks';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font } from '@react-pdf/renderer';

interface PDFReportBlockOneProps {
  className?: string;
}

const PDFReportBlockOne: React.FC<PDFReportBlockOneProps> = ({ className }) => {
  const blockOneState = useAppSelector(state => state.blockOne);

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
      borderBottomColor: '#3498db',
      paddingBottom: 15
    },
    sectionTitle: { 
      fontSize: 16, 
      marginTop: 20, 
      marginBottom: 15, 
      fontWeight: 600, 
      color: '#2c3e50',
      borderLeftWidth: 4,
      borderLeftColor: '#e74c3c',
      paddingLeft: 12
    },
    table: {
      width: '100%',
      marginBottom: 20,
      borderStyle: 'solid',
      borderWidth: 2,
      borderColor: '#3498db',
      borderRadius: 8
    },
    tableHeader: {
      backgroundColor: '#f8f9fa',
      color: '#2c3e50',
      fontWeight: 600,
      fontSize: 12,
      borderBottomWidth: 2,
      borderBottomColor: '#3498db'
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
    totalSection: {
      borderWidth: 2,
      borderColor: '#27ae60',
      borderStyle: 'solid',
      padding: 15,
      borderRadius: 8,
      marginTop: 20,
      backgroundColor: '#ffffff'
    },
    totalTitle: {
      fontSize: 16,
      fontWeight: 600,
      color: '#27ae60',
      marginBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#27ae60',
      paddingBottom: 5
    },
    totalItem: {
      fontSize: 12,
      marginBottom: 6,
      color: '#2c3e50'
    },
    totalAmount: {
      fontSize: 18,
      fontWeight: 700,
      color: '#27ae60',
      marginTop: 10,
      borderWidth: 2,
      borderColor: '#27ae60',
      borderStyle: 'solid',
      padding: 10,
      borderRadius: 6,
      textAlign: 'center'
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

  const ReportDocument = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Звіт з бюджетного фінансування доріг</Text>

        {/* Державні дороги таблиця */}
        <Text style={styles.sectionTitle}>Державні дороги</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCellHeader}>Назва статті</Text>
            <Text style={styles.tableCellHeader}>Сума (тис. грн)</Text>
          </View>
          {blockOneState.stateRoadBudget.map((item: any, idx: number) => (
            <View key={`state-${idx}`} style={[styles.tableRow, idx % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}>
              <Text style={styles.tableCell}>{item.name}</Text>
              <Text style={styles.tableCell}>{item.value ? item.value.toLocaleString() : 'Не вказано'}</Text>
            </View>
          ))}
          {blockOneState.q1Result && (
            <View style={[styles.tableRow, styles.tableRowEven, { backgroundColor: '#d5dbdb' }]}>
              <Text style={[styles.tableCell, { fontWeight: 600, color: '#2c3e50' }]}>Результат Q1</Text>
              <Text style={[styles.tableCell, { fontWeight: 600, color: '#27ae60' }]}>{blockOneState.q1Result.toLocaleString()}</Text>
            </View>
          )}
        </View>

        {/* Місцеві дороги таблиця */}
        <Text style={styles.sectionTitle}>Місцеві дороги</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCellHeader}>Назва статті</Text>
            <Text style={styles.tableCellHeader}>Сума (тис. грн)</Text>
          </View>
          {blockOneState.localRoadBudget.map((item: any, idx: number) => (
            <View key={`local-${idx}`} style={[styles.tableRow, idx % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}>
              <Text style={styles.tableCell}>{item.name}</Text>
              <Text style={styles.tableCell}>{item.value ? item.value.toLocaleString() : 'Не вказано'}</Text>
            </View>
          ))}
          {blockOneState.q2Result && (
            <View style={[styles.tableRow, styles.tableRowEven, { backgroundColor: '#d5dbdb' }]}>
              <Text style={[styles.tableCell, { fontWeight: 600, color: '#2c3e50' }]}>Результат Q2</Text>
              <Text style={[styles.tableCell, { fontWeight: 600, color: '#27ae60' }]}>{blockOneState.q2Result.toLocaleString()}</Text>
            </View>
          )}
        </View>

        {/* Загальний результат */}
        {(blockOneState.q1Result || blockOneState.q2Result) && (
          <View style={styles.totalSection}>
            <Text style={styles.totalTitle}>Загальний результат</Text>
            <Text style={styles.totalItem}>Q1 (Державні дороги): {blockOneState.q1Result ? blockOneState.q1Result.toLocaleString() : 'Не розраховано'} тис. грн</Text>
            <Text style={styles.totalItem}>Q2 (Місцеві дороги): {blockOneState.q2Result ? blockOneState.q2Result.toLocaleString() : 'Не розраховано'} тис. грн</Text>
            <Text style={styles.totalAmount}>
              Загальний бюджет: {(((blockOneState.q1Result || 0) + (blockOneState.q2Result || 0))).toLocaleString()} тис. грн
            </Text>
          </View>
        )}

        <Text style={styles.footer}>{`Звіт згенеровано: ${new Date().toLocaleString('uk-UA')}`}</Text>
      </Page>
    </Document>
  );

  const hasData = (
    !!blockOneState.q1Result ||
    !!blockOneState.q2Result ||
    blockOneState.stateRoadBudget.length > 0 ||
    blockOneState.localRoadBudget.length > 0
  );

  if (!hasData) {
    return (
      <Button className={className} disabled>
        <Download className="mr-2 h-4 w-4" /> Немає даних для звіту
      </Button>
    );
  }

  return (
    <PDFDownloadLink
      document={ReportDocument}
      fileName={`звіт_бюджетне_фінансування_${new Date().toLocaleDateString('uk-UA').replace(/\./g, '_')}.pdf`}
    >
      {({ loading }) => (
        <Button className={className}>
          <Download className="mr-2 h-4 w-4" /> {loading ? 'Генеруємо...' : 'Завантажити PDF звіт'}
    </Button>
      )}
    </PDFDownloadLink>
  );
};

export default PDFReportBlockOne;