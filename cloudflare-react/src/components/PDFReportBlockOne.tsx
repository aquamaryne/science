import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useAppSelector } from '@/redux/hooks';
import jsPDF from 'jspdf';

interface PDFReportBlockOneProps {
  className?: string;
}

// Функция для конвертации текста в правильную кодировку
const convertText = (text: string): string => {
  // Простая замена проблемных символов
  return text
    .replace(/і/g, 'i')
    .replace(/ї/g, 'ji')
    .replace(/є/g, 'e')
    .replace(/ґ/g, 'g')
    .replace(/І/g, 'I')
    .replace(/Ї/g, 'Ji')
    .replace(/Є/g, 'E')
    .replace(/Ґ/g, 'G');
};

const PDFReportBlockOne: React.FC<PDFReportBlockOneProps> = ({ className }) => {
  const blockOneState = useAppSelector(state => state.blockOne);

  const generatePDF = async () => {
    if (!blockOneState.q1Result && !blockOneState.q2Result &&
        blockOneState.stateRoadBudget.length === 0 &&
        blockOneState.localRoadBudget.length === 0) {
      alert('Немає даних для генерації PDF звіту');
      return;
    }

    try {
      // Создаем PDF в альбомной ориентации
      const pdf = new jsPDF('l', 'mm', 'a4'); // landscape, millimeters, A4
      
      // Заголовок
      pdf.setFontSize(20);
      pdf.text(convertText('Звіт з розрахунку бюджетного фінансування доріг'), 105, 20, { align: 'center' });
      
      let yPosition = 40;
      
      // Державні дороги
      pdf.setFontSize(16);
      pdf.text(convertText('Державні дороги'), 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(12);
      blockOneState.stateRoadBudget.forEach((item: any) => {
        const text = `${convertText(item.name)}: ${item.value ? item.value.toLocaleString() : 'Не вказано'} тис. грн`;
        pdf.text(text, 30, yPosition);
        yPosition += 6;
      });
      
      if (blockOneState.q1Result) {
        yPosition += 5;
        pdf.setFontSize(14);
        pdf.text(convertText(`Результат Q1: ${blockOneState.q1Result.toLocaleString()} тис. грн`), 30, yPosition);
        yPosition += 10;
      }
      
      // Місцеві дороги
      pdf.setFontSize(16);
      pdf.text(convertText('Місцеві дороги'), 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(12);
      blockOneState.localRoadBudget.forEach((item: any) => {
        const text = `${convertText(item.name)}: ${item.value ? item.value.toLocaleString() : 'Не вказано'} тис. грн`;
        pdf.text(text, 30, yPosition);
        yPosition += 6;
      });
      
      if (blockOneState.q2Result) {
        yPosition += 5;
        pdf.setFontSize(14);
        pdf.text(convertText(`Результат Q2: ${blockOneState.q2Result.toLocaleString()} тис. грн`), 30, yPosition);
        yPosition += 10;
      }
      
      // Загальний результат
      if (blockOneState.q1Result || blockOneState.q2Result) {
        yPosition += 10;
        pdf.setFontSize(16);
        pdf.text(convertText('Загальний результат'), 20, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(12);
        pdf.text(convertText(`Q1 (Державні дороги): ${blockOneState.q1Result ? blockOneState.q1Result.toLocaleString() : 'Не розраховано'} тис. грн`), 30, yPosition);
        yPosition += 6;
        pdf.text(convertText(`Q2 (Місцеві дороги): ${blockOneState.q2Result ? blockOneState.q2Result.toLocaleString() : 'Не розраховано'} тис. грн`), 30, yPosition);
        yPosition += 6;
        
        pdf.setFontSize(14);
        const total = (blockOneState.q1Result || 0) + (blockOneState.q2Result || 0);
        pdf.text(convertText(`Загальний бюджет: ${total.toLocaleString()} тис. грн`), 30, yPosition);
      }
      
      // Дата
      yPosition += 20;
      pdf.setFontSize(10);
      pdf.text(convertText(`Звіт згенеровано: ${new Date().toLocaleString('uk-UA')}`), 105, yPosition, { align: 'center' });
      
      // Скачиваем PDF
      pdf.save('звіт_бюджетне_фінансування.pdf');
      
    } catch (error) {
      console.error('Помилка генерації PDF:', error);
      alert('Помилка генерації PDF: ' + (error instanceof Error ? error.message : 'Невідома помилка'));
    }
  };

  return (
    <Button onClick={generatePDF} className={className}>
      <Download className="mr-2 h-4 w-4" /> Завантажити PDF звіт
    </Button>
  );
};

export default PDFReportBlockOne;