import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';

interface PDFReportBlockThreeProps {
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

const PDFReportBlockThree: React.FC<PDFReportBlockThreeProps> = ({ className }) => {

  const generatePDF = async () => {
    try {
      // Создаем PDF в альбомной ориентации
      const pdf = new jsPDF('l', 'mm', 'a4'); // landscape, millimeters, A4
      
      // Заголовок
      pdf.setFontSize(20);
      pdf.text(convertText('Звіт з розрахунку економічної ефективності доріг'), 105, 20, { align: 'center' });
      
      let yPosition = 40;
      
      // Общая информация
      pdf.setFontSize(16);
      pdf.text(convertText('Інформація про розрахунки'), 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(12);
      pdf.text(convertText('Дані збережено в системі'), 30, yPosition);
      yPosition += 6;
      pdf.text(convertText('Розрахунки виконано успішно'), 30, yPosition);
      
      // Дата
      yPosition += 20;
      pdf.setFontSize(10);
      pdf.text(convertText(`Звіт згенеровано: ${new Date().toLocaleString('uk-UA')}`), 105, yPosition, { align: 'center' });
      
      // Скачиваем PDF
      pdf.save('звіт_економічна_ефективність.pdf');
      
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

export default PDFReportBlockThree;