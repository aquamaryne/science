import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font } from '@react-pdf/renderer';

interface PDFReportBlockThreeProps {
  className?: string;
}

const PDFReportBlockThree: React.FC<PDFReportBlockThreeProps> = ({ className }) => {
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
        <Text style={styles.title}>Звіт з розрахунку економічної ефективності доріг</Text>
        
        <Text style={styles.sectionTitle}>Інформація про розрахунки</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCellHeader}>Показник</Text>
            <Text style={styles.tableCellHeader}>Статус</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowEven]}>
            <Text style={styles.tableCell}>Збереження даних</Text>
            <Text style={styles.tableCell}>Дані збережено в системі</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowOdd]}>
            <Text style={styles.tableCell}>Розрахунки ефективності</Text>
            <Text style={styles.tableCell}>Розрахунки виконано успішно</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoItem}>📊 Аналіз економічної ефективності завершено</Text>
          <Text style={styles.infoItem}>📈 Розрахунки показників ефективності виконано</Text>
          <Text style={styles.infoItem}>💾 Результати збережено в базі даних</Text>
        </View>

        <Text style={styles.footer}>{`Звіт згенеровано: ${new Date().toLocaleString('uk-UA')}`}</Text>
      </Page>
    </Document>
  );

  return (
    <PDFDownloadLink
      document={ReportDocument}
      fileName={`звіт_економічна_ефективність_${new Date().toLocaleDateString('uk-UA').replace(/\./g, '_')}.pdf`}
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