self.onmessage = function(e) {
  const { worksheet, selectedRegion, selectedWorksheet, inflationIndex, regionCoefficients } = e.data;
  
  try {
    // Тяжелые вычисления здесь
    const calculatedValues = {};
    let totalSum = 0;
    let numberCount = 0;

    worksheet.cells.forEach(cell => {
      if (cell.type === 'number' && typeof cell.value === 'number') {
        totalSum += cell.value;
        numberCount++;
      }
      calculatedValues[cell.address] = cell.value;
    });

    const result = {
      worksheet: selectedWorksheet,
      totalCells: worksheet.cells.length,
      calculatedValues: {
        TOTAL_SUM: totalSum,
        AVERAGE: numberCount > 0 ? totalSum / numberCount : 0,
        COUNT_NUMBERS: numberCount,
        COUNT_FILLED: worksheet.cells.filter(c => c.value !== '').length
      }
    };

    self.postMessage({ result });
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};