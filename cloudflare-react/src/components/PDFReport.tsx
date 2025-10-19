import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, FileText, CheckCircle, TrendingUp, Calculator, Settings } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useAppSelector } from '@/redux/hooks';

interface PDFReportProps {
  className?: string;
}

const PDFReport: React.FC<PDFReportProps> = ({ className }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const currentSession = useAppSelector(state => state.history.currentSession);
  
  // Получаем данные из Redux
  const blockOneData = currentSession?.blockOneData;
  const blockTwoData = currentSession?.blockTwoData;
  const blockThreeData = currentSession?.blockThreeData;

  const generatePDF = async () => {
    if (!reportRef.current) return;

    try {
      // Создаем canvas из HTML
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Добавляем первую страницу
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Добавляем дополнительные страницы если нужно
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Сохраняем PDF
      const fileName = `Звіт_дорожніх_розрахунків_${new Date().toLocaleDateString('uk-UA').replace(/\./g, '_')}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Помилка генерації PDF:', error);
      alert('Помилка при створенні PDF звіту');
    }
  };

  const hasData = blockOneData || blockTwoData || blockThreeData;

  return (
    <div className={className}>
      <Card className="border-2 border-blue-500">
        <CardHeader className="bg-blue-50">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            Генерація PDF звіту
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasData && (
            <Alert className="bg-yellow-50 border-yellow-300">
              <AlertDescription className="text-yellow-800">
                <strong>⚠️ Немає даних для звіту!</strong>
                <div className="text-sm mt-1">
                  Виконайте розрахунки в розділах "Розрахунок бюджетного фінансування доріг" 
                  та "Експлуатаційне утримання доріг" для створення звіту.
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={generatePDF}
            disabled={!hasData}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Завантажити PDF звіт
          </Button>

          <div className="text-sm text-gray-600">
            Звіт буде містити всі результати розрахунків з усіх розділів системи
          </div>
        </CardContent>
      </Card>

      {/* Прихований контент для PDF */}
      <div ref={reportRef} className="hidden">
        <div className="p-8 bg-white text-black" style={{ fontFamily: 'Arial, sans-serif' }}>
          {/* Заголовок звіту */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-900 mb-2">
              ЗВІТ ПРО РОЗРАХУНКИ ДОРОЖНЬОГО ФІНАНСУВАННЯ
            </h1>
            <p className="text-lg text-gray-700">
              Система розрахунку дорожнього фінансування та планування ремонтів
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Дата створення: {new Date().toLocaleDateString('uk-UA')}
            </p>
          </div>

          {/* Розділ 1: Бюджетне фінансування */}
          {blockOneData && (
            <div className="mb-8">
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
                  <Calculator className="h-6 w-6" />
                  1. РОЗРАХУНОК БЮДЖЕТНОГО ФІНАНСУВАННЯ ДОРІГ
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Державні дороги (Q₁)</h3>
                  <div className="text-2xl font-bold text-blue-700">
                    {blockOneData.q1Result?.toLocaleString('uk-UA') || '—'} тис. грн
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">Місцеві дороги (Q₂)</h3>
                  <div className="text-2xl font-bold text-green-700">
                    {blockOneData.q2Result?.toLocaleString('uk-UA') || '—'} тис. грн
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-900 mb-2">Загальний бюджет</h3>
                <div className="text-3xl font-bold text-purple-700">
                  {((blockOneData.q1Result || 0) + (blockOneData.q2Result || 0)).toLocaleString('uk-UA')} тис. грн
                </div>
              </div>
            </div>
          )}

          {/* Розділ 2: Експлуатаційне утримання */}
          {blockTwoData && (
            <div className="mb-8">
              <div className="bg-green-50 p-4 rounded-lg mb-4">
                <h2 className="text-2xl font-bold text-green-900 flex items-center gap-2">
                  <TrendingUp className="h-6 w-6" />
                  2. ЕКСПЛУАТАЦІЙНЕ УТРИМАННЯ ДОРІГ
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Державні дороги</h3>
                  <div className="text-2xl font-bold text-blue-700">
                    {blockTwoData.fundingResults?.stateFunding?.toLocaleString('uk-UA') || '—'} тис. грн
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">Місцеві дороги</h3>
                  <div className="text-2xl font-bold text-green-700">
                    {blockTwoData.fundingResults?.localFunding?.toLocaleString('uk-UA') || '—'} тис. грн
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-orange-900 mb-2">Загальний обсяг фінансування</h3>
                <div className="text-3xl font-bold text-orange-700">
                  {blockTwoData.fundingResults?.totalFunding?.toLocaleString('uk-UA') || '—'} тис. грн
                </div>
              </div>
            </div>
          )}

          {/* Розділ 3: Планування ремонтів */}
          {blockThreeData && (
            <div className="mb-8">
              <div className="bg-purple-50 p-4 rounded-lg mb-4">
                <h2 className="text-2xl font-bold text-purple-900 flex items-center gap-2">
                  <Settings className="h-6 w-6" />
                  3. ПЛАНУВАННЯ РЕМОНТІВ АВТОМОБІЛЬНИХ ДОРІГ
                </h2>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-700">
                    {blockThreeData.enpvResults?.enpv?.toFixed(2) || '—'}
                  </div>
                  <div className="text-sm text-gray-600">ENPV (млн грн)</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-700">
                    {blockThreeData.enpvResults?.eirr?.toFixed(1) || '—'}%
                  </div>
                  <div className="text-sm text-gray-600">EIRR</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-700">
                    {blockThreeData.enpvResults?.bcr?.toFixed(2) || '—'}
                  </div>
                  <div className="text-sm text-gray-600">BCR</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-700">
                    {blockThreeData.enpvResults?.paybackPeriod?.toFixed(1) || '—'}
                  </div>
                  <div className="text-sm text-gray-600">Окупність (років)</div>
                </div>
              </div>
            </div>
          )}

          {/* Підсумок */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              ПІДСУМОК РОЗРАХУНКІВ
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-blue-700">
                  {blockOneData ? '✓' : '✗'}
                </div>
                <div className="text-sm text-gray-600">Бюджетне фінансування</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-green-700">
                  {blockTwoData ? '✓' : '✗'}
                </div>
                <div className="text-sm text-gray-600">Експлуатаційне утримання</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-purple-700">
                  {blockThreeData ? '✓' : '✗'}
                </div>
                <div className="text-sm text-gray-600">Планування ремонтів</div>
              </div>
            </div>
          </div>

          {/* Футер */}
          <div className="mt-8 pt-4 border-t border-gray-300 text-center text-sm text-gray-500">
            <p>Звіт створено автоматично системою розрахунку дорожнього фінансування</p>
            <p>Дата: {new Date().toLocaleString('uk-UA')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFReport;
