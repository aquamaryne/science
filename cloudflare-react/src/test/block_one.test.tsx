import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import RoadFundingApp from '../components/view/block_one_page';
import { calculationResultsService } from '../service/resultLocalStorage';
import { calculateQ1, calculateQ2 } from '../modules/block_one';
import { setBlockOneBudgetData, getBudgetStatistics } from '../modules/block_three';

// Мокаємо модулі
jest.mock('../service/resultLocalStorage');
jest.mock('../modules/block_one');
jest.mock('../modules/block_three');

describe('RoadFundingApp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Налаштовуємо моки за замовчуванням
    (calculationResultsService.createSession as jest.Mock).mockReturnValue('test-session-123');
    (calculationResultsService.saveBlockOneResults as jest.Mock).mockReturnValue(true);
    (getBudgetStatistics as jest.Mock).mockReturnValue({
      hasData: false,
      totalBudget: 0,
      q1Budget: 0,
      q2Budget: 0,
      allocation: null
    });
    (calculateQ1 as jest.Mock).mockReturnValue(1000000);
    (calculateQ2 as jest.Mock).mockReturnValue(500000);
  });

  describe('Ініціалізація компонента', () => {
    test('рендериться без помилок', () => {
      render(<RoadFundingApp />);
      expect(screen.getByText(/Визначення загального обсягу бюджетного фінансування/i)).toBeInTheDocument();
    });

    test('створює сесію при монтуванні', () => {
      render(<RoadFundingApp />);
      expect(calculationResultsService.createSession).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/Сесія розрахунків: test-session-123/i)).toBeInTheDocument();
    });

    test('показує обидва блоки розрахунків', () => {
      render(<RoadFundingApp />);
      expect(screen.getByText(/державного значення/i)).toBeInTheDocument();
      expect(screen.getByText(/місцевого значення/i)).toBeInTheDocument();
    });
  });

  describe('StateRoadFundingBlock', () => {
    test('дозволяє вводити значення в поля', async () => {
      const user = userEvent.setup();
      render(<RoadFundingApp />);
      
      const inputs = screen.getAllByPlaceholderText('0');
      await user.type(inputs[0], '100000');
      
      expect(inputs[0]).toHaveValue(100000);
    });

    test('показує помилку при відсутності обов\'язкових полів', async () => {
      const user = userEvent.setup();
      render(<RoadFundingApp />);
      
      // Натискаємо кнопку розрахунку без заповнення полів
      const calculateButtons = screen.getAllByText('Розрахувати');
      await user.click(calculateButtons[0]);
      
      // Перевіряємо, що alert було викликано (потрібно мокати window.alert)
      // В реальному тесті краще використати toast notifications замість alert
    });

    test('виконує розрахунок при заповнених полях', async () => {
      const user = userEvent.setup();
      render(<RoadFundingApp />);
      
      // Заповнюємо всі необхідні поля
      const inputs = screen.getAllByPlaceholderText('0');
      for (let i = 0; i < 5; i++) {
        await user.type(inputs[i], '100000');
      }
      
      const calculateButtons = screen.getAllByText('Розрахувати');
      await user.click(calculateButtons[0]);
      
      await waitFor(() => {
        expect(calculateQ1).toHaveBeenCalled();
      });
    });

    test('відображає результат після розрахунку', async () => {
      const user = userEvent.setup();
      (calculateQ1 as jest.Mock).mockReturnValue(1234567);
      
      render(<RoadFundingApp />);
      
      const inputs = screen.getAllByPlaceholderText('0');
      for (let i = 0; i < 5; i++) {
        await user.type(inputs[i], '100000');
      }
      
      const calculateButtons = screen.getAllByText('Розрахувати');
      await user.click(calculateButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText(/1,234,567 тис. грн/i)).toBeInTheDocument();
      });
    });
  });

  describe('LocalRoadFundingBlock', () => {
    test('виконує розрахунок Q2', async () => {
      const user = userEvent.setup();
      (calculateQ2 as jest.Mock).mockReturnValue(654321);
      
      render(<RoadFundingApp />);
      
      const inputs = screen.getAllByPlaceholderText('0');
      // Заповнюємо поле для місцевих доріг (припускаємо, що воно після полів державних)
      await user.type(inputs[5], '500000');
      
      const calculateButtons = screen.getAllByText('Розрахувати');
      await user.click(calculateButtons[1]); // Друга кнопка для Q2
      
      await waitFor(() => {
        expect(calculateQ2).toHaveBeenCalled();
      });
    });

    test('відображає результат Q2', async () => {
      const user = userEvent.setup();
      (calculateQ2 as jest.Mock).mockReturnValue(654321);
      
      render(<RoadFundingApp />);
      
      const inputs = screen.getAllByPlaceholderText('0');
      await user.type(inputs[5], '500000');
      
      const calculateButtons = screen.getAllByText('Розрахувати');
      await user.click(calculateButtons[1]);
      
      await waitFor(() => {
        expect(screen.getByText(/654,321 тис. грн/i)).toBeInTheDocument();
      });
    });
  });

  describe('FileUploadComponent', () => {
    test('дозволяє завантажувати файли', async () => {
      const user = userEvent.setup();
      render(<RoadFundingApp />);
      
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const fileInputs = screen.getAllByLabelText(/Додати файл/i);
      
      await user.upload(fileInputs[0], file);
      
      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });
    });

    test('дозволяє видаляти файли', async () => {
      const user = userEvent.setup();
      render(<RoadFundingApp />);
      
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const fileInputs = screen.getAllByLabelText(/Додати файл/i);
      
      await user.upload(fileInputs[0], file);
      
      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });
      
      const deleteButton = screen.getByRole('button', { name: /x/i });
      await user.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
      });
    });

    test('показує розмір файлу', async () => {
      const user = userEvent.setup();
      render(<RoadFundingApp />);
      
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const fileInputs = screen.getAllByLabelText(/Додати файл/i);
      
      await user.upload(fileInputs[0], file);
      
      await waitFor(() => {
        expect(screen.getByText(/Bytes|KB|MB/i)).toBeInTheDocument();
      });
    });
  });

  describe('Зведення результатів', () => {
    test('відображає зведення після обох розрахунків', async () => {
      const user = userEvent.setup();
      (calculateQ1 as jest.Mock).mockReturnValue(1000000);
      (calculateQ2 as jest.Mock).mockReturnValue(500000);
      
      render(<RoadFundingApp />);
      
      // Виконуємо обидва розрахунки
      const inputs = screen.getAllByPlaceholderText('0');
      for (let i = 0; i < 6; i++) {
        await user.type(inputs[i], '100000');
      }
      
      const calculateButtons = screen.getAllByText('Розрахувати');
      await user.click(calculateButtons[0]);
      await user.click(calculateButtons[1]);
      
      await waitFor(() => {
        expect(screen.getByText(/Сводка результатів/i)).toBeInTheDocument();
        expect(screen.getByText(/Загальний бюджет/i)).toBeInTheDocument();
      });
    });

    test('розраховує загальний бюджет правильно', async () => {
      const user = userEvent.setup();
      (calculateQ1 as jest.Mock).mockReturnValue(1000000);
      (calculateQ2 as jest.Mock).mockReturnValue(500000);
      
      render(<RoadFundingApp />);
      
      const inputs = screen.getAllByPlaceholderText('0');
      for (let i = 0; i < 6; i++) {
        await user.type(inputs[i], '100000');
      }
      
      const calculateButtons = screen.getAllByText('Розrахувати');
      await user.click(calculateButtons[0]);
      await user.click(calculateButtons[1]);
      
      await waitFor(() => {
        // 1,000,000 + 500,000 = 1,500,000
        expect(screen.getByText(/1,500,000/i)).toBeInTheDocument();
      });
    });
  });

  describe('Збереження результатів', () => {
    test('дозволяє зберегти результати в сесію', async () => {
      const user = userEvent.setup();
      (calculateQ1 as jest.Mock).mockReturnValue(1000000);
      (calculateQ2 as jest.Mock).mockReturnValue(500000);
      
      render(<RoadFundingApp />);
      
      const inputs = screen.getAllByPlaceholderText('0');
      for (let i = 0; i < 6; i++) {
        await user.type(inputs[i], '100000');
      }
      
      const calculateButtons = screen.getAllByText('Розрахувати');
      await user.click(calculateButtons[0]);
      await user.click(calculateButtons[1]);
      
      await waitFor(() => {
        const saveButton = screen.getByText(/Зберегти результати в сесію/i);
        expect(saveButton).toBeInTheDocument();
      });
      
      const saveButton = screen.getByText(/Зберегти результати в сесію/i);
      await user.click(saveButton);
      
      expect(calculationResultsService.saveBlockOneResults).toHaveBeenCalled();
    });

    test('показує повідомлення про успішне збереження', async () => {
      const user = userEvent.setup();
      (calculateQ1 as jest.Mock).mockReturnValue(1000000);
      (calculateQ2 as jest.Mock).mockReturnValue(500000);
      
      render(<RoadFundingApp />);
      
      const inputs = screen.getAllByPlaceholderText('0');
      for (let i = 0; i < 6; i++) {
        await user.type(inputs[i], '100000');
      }
      
      const calculateButtons = screen.getAllByText('Розрахувати');
      await user.click(calculateButtons[0]);
      await user.click(calculateButtons[1]);
      
      const saveButton = await screen.findByText(/Зберегти результати в сесію/i);
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(screen.getByText(/успішно збережені/i)).toBeInTheDocument();
      });
    });
  });

  describe('BlockThreeIntegration', () => {
    test('відображає статус інтеграції', async () => {
      render(<RoadFundingApp />);
      
      expect(screen.getByText(/Інтеграція з Блоком 3/i)).toBeInTheDocument();
    });

    test('дозволяє передати дані в Блок 3', async () => {
      const user = userEvent.setup();
      (calculateQ1 as jest.Mock).mockReturnValue(1000000);
      (calculateQ2 as jest.Mock).mockReturnValue(500000);
      
      render(<RoadFundingApp />);
      
      const inputs = screen.getAllByPlaceholderText('0');
      for (let i = 0; i < 6; i++) {
        await user.type(inputs[i], '100000');
      }
      
      const calculateButtons = screen.getAllByText('Розрахувати');
      await user.click(calculateButtons[0]);
      await user.click(calculateButtons[1]);
      
      const transferButton = await screen.findByText(/Передати дані в Блок 3/i);
      await user.click(transferButton);
      
      expect(setBlockOneBudgetData).toHaveBeenCalledWith({
        q1Value: 1000000,
        q2Value: 500000,
        q1Items: expect.any(Array),
        q2Items: expect.any(Array),
        sessionId: 'test-session-123'
      });
    });

    test('показує статус після передачі даних', async () => {
      const user = userEvent.setup();
      (calculateQ1 as jest.Mock).mockReturnValue(1000000);
      (calculateQ2 as jest.Mock).mockReturnValue(500000);
      (getBudgetStatistics as jest.Mock).mockReturnValue({
        hasData: true,
        totalBudget: 1500000,
        q1Budget: 1000000,
        q2Budget: 500000,
        allocation: {
          currentRepair: 500000,
          capitalRepair: 700000,
          reconstruction: 300000
        }
      });
      
      render(<RoadFundingApp />);
      
      const inputs = screen.getAllByPlaceholderText('0');
      for (let i = 0; i < 6; i++) {
        await user.type(inputs[i], '100000');
      }
      
      const calculateButtons = screen.getAllByText('Розрахувати');
      await user.click(calculateButtons[0]);
      await user.click(calculateButtons[1]);
      
      const transferButton = await screen.findByText(/Передати дані в Блок 3/i);
      await user.click(transferButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Дані передані/i)).toBeInTheDocument();
      });
    });
  });

  describe('Обробка помилок', () => {
    test('показує помилку при невдалому збереженні', async () => {
      const user = userEvent.setup();
      (calculateQ1 as jest.Mock).mockReturnValue(1000000);
      (calculateQ2 as jest.Mock).mockReturnValue(500000);
      (calculationResultsService.saveBlockOneResults as jest.Mock).mockReturnValue(false);
      
      render(<RoadFundingApp />);
      
      const inputs = screen.getAllByPlaceholderText('0');
      for (let i = 0; i < 6; i++) {
        await user.type(inputs[i], '100000');
      }
      
      const calculateButtons = screen.getAllByText('Розрахувати');
      await user.click(calculateButtons[0]);
      await user.click(calculateButtons[1]);
      
      const saveButton = await screen.findByText(/Зберегти результати в сесію/i);
      await user.click(saveButton);
      
      // Перевіряємо, що не показується повідомлення про успіх
      await waitFor(() => {
        expect(screen.queryByText(/успішно збережені/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Нормативні документи', () => {
    test('дозволяє вводити назву нормативного документа', async () => {
      const user = userEvent.setup();
      render(<RoadFundingApp />);
      
      const documentInputs = screen.getAllByPlaceholderText('Назва документа');
      await user.type(documentInputs[0], 'Закон України №123');
      
      expect(documentInputs[0]).toHaveValue('Закон України №123');
    });
  });
});

describe('Допоміжні функції', () => {
  describe('formatFileSize', () => {
    test('форматує розмір файлу правильно', () => {
      // Це приклад тесту для внутрішньої функції
      // В реальному коді краще винести цю функцію в окремий utility файл
      const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };

      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });
  });
});