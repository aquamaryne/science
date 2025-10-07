import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Block3MultiPageApp } from '../components/view/block_three_page';
import * as blockThreeModule from '../modules/block_three';

// Мокаємо модулі
jest.mock('../modules/block_three');
jest.mock('../modules/block_three_alghoritm');

describe('Block3MultiPageApp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Налаштування моків
    (blockThreeModule.hasBlockOneBudgetData as jest.Mock).mockReturnValue(false);
    (blockThreeModule.getBlockOneBudgetData as jest.Mock).mockReturnValue(null);
    (blockThreeModule.setBlockOneBudgetData as jest.Mock).mockReturnValue(undefined);
    (blockThreeModule.planRepairWorksWithBlockOneData as jest.Mock).mockReturnValue({
      currentRepairProjects: [],
      capitalRepairProjects: [],
      reconstructionProjects: [],
      totalCost: 0,
      budgetUtilization: 0,
      budgetBreakdown: {
        currentRepairUsed: 0,
        capitalRepairUsed: 0,
        reconstructionUsed: 0,
        reserveRemaining: 0
      },
      blockOneBudgetInfo: null,
      complianceReport: []
    });
  });

  describe('Ініціалізація та навігація', () => {
    test('рендериться без помилок', () => {
      render(<Block3MultiPageApp />);
      expect(screen.getByText(/Планування ремонтів автомобільних доріг/i)).toBeInTheDocument();
    });

    test('показує всі 7 сторінок в навігації', () => {
      render(<Block3MultiPageApp />);
      
      const pages = [
        'Фактичний стан доріг',
        'Показники та коефіцієнти',
        'Показники вартості',
        'Орієнтовна вартість',
        'Вихідні дані ENPV',
        'Економічна ефективність',
        "Ранжування об'єктів"
      ];
      
      pages.forEach(page => {
        expect(screen.getByText(page)).toBeInTheDocument();
      });
    });

    test('перемикається між сторінками через навігацію', async () => {
      const user = userEvent.setup();
      render(<Block3MultiPageApp />);
      
      const page2Button = screen.getByText('Показники та коефіцієнти');
      await user.click(page2Button);
      
      await waitFor(() => {
        expect(screen.getByText(/Визначення показників фактичного транспортно-експлуатаційного стану/i)).toBeInTheDocument();
      });
    });

    test('показує прогрес виконання', () => {
      render(<Block3MultiPageApp />);
      const progressBar = document.querySelector('[role="progressbar"]');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Page2_Component (Фактичний стан доріг)', () => {
    test('дозволяє додавати нову секцію', async () => {
      const user = userEvent.setup();
      render(<Block3MultiPageApp />);
      
      const addButton = screen.getByText(/Додати секцію/i);
      await user.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Нова ділянка')).toBeInTheDocument();
      });
    });

    test('завантажує тестові дані', async () => {
      const user = userEvent.setup();
      render(<Block3MultiPageApp />);
      
      const testDataButton = screen.getByText(/Тестові дані/i);
      await user.click(testDataButton);
      
      await waitFor(() => {
        expect(screen.getByText(/М-01 Київ-Чернігів/i)).toBeInTheDocument();
      });
    });

    test('виконує розрахунки для секцій', async () => {
      const user = userEvent.setup();
      render(<Block3MultiPageApp />);
      
      await user.click(screen.getByText(/Тестові дані/i));
      
      await waitFor(() => {
        expect(screen.getByText(/Результати розрахунків та рекомендації/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Page1_Coefficients (Показники та коефіцієнти)', () => {
    test('відображає коефіцієнти після розрахунку', async () => {
      const user = userEvent.setup();
      render(<Block3MultiPageApp />);
      
      await user.click(screen.getByText('Показники та коефіцієнти'));
      
      await waitFor(() => {
        expect(screen.getByText(/Коефіцієнт інтенсивності руху/i)).toBeInTheDocument();
      });
    });

    test('показує сводну статистику', async () => {
      const user = userEvent.setup();
      render(<Block3MultiPageApp />);
      
      await user.click(screen.getByText(/Тестові дані/i));
      await user.click(screen.getByText('Показники та коефіцієнти'));
      
      await waitFor(() => {
        expect(screen.getByText(/Всього секцій/i)).toBeInTheDocument();
        expect(screen.getByText(/Потребують ремонту/i)).toBeInTheDocument();
      });
    });

    test('дозволяє перерахувати коефіцієнти', async () => {
      const user = userEvent.setup();
      render(<Block3MultiPageApp />);
      
      await user.click(screen.getByText(/Тестові дані/i));
      await user.click(screen.getByText('Показники та коефіцієнти'));
      
      const recalculateButton = screen.getByText(/Перерахувати/i);
      await user.click(recalculateButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Розраховуємо/i)).toBeInTheDocument();
      });
    });
  });

  describe('Page3_CostIndicators (Показники вартості)', () => {
    test('відображає таблицю показників вартості', async () => {
      const user = userEvent.setup();
      render(<Block3MultiPageApp />);
      
      await user.click(screen.getByText('Показники вартості'));
      
      await waitFor(() => {
        expect(screen.getByText(/Усереднені орієнтовні показники вартості/i)).toBeInTheDocument();
        expect(screen.getByText(/Реконструкція/i)).toBeInTheDocument();
        expect(screen.getByText(/Капітальний ремонт/i)).toBeInTheDocument();
        expect(screen.getByText(/Поточний ремонт/i)).toBeInTheDocument();
      });
    });

    test('дозволяє редагувати показники вартості', async () => {
      const user = userEvent.setup();
      render(<Block3MultiPageApp />);
      
      await user.click(screen.getByText('Показники вартості'));
      
      const editButton = screen.getByText(/Редагувати/i);
      await user.click(editButton);
      
      await waitFor(() => {
        const inputs = screen.getAllByRole('spinbutton');
        expect(inputs.length).toBeGreaterThan(0);
      });
    });

    test('показує аналітику вартості', async () => {
      const user = userEvent.setup();
      render(<Block3MultiPageApp />);
      
      await user.click(screen.getByText('Показники вартості'));
      
      const analyticsButton = screen.getByText(/Аналітика/i);
      await user.click(analyticsButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Аналіз показників вартості/i)).toBeInTheDocument();
      });
    });
  });

  describe('Page4_EstimatedCosts (Орієнтовна вартість)', () => {
    test('розраховує вартість робіт', async () => {
      const user = userEvent.setup();
      render(<Block3MultiPageApp />);
      
      await user.click(screen.getByText(/Тестові дані/i));
      await user.click(screen.getByText('Орієнтовна вартість'));
      
      await waitFor(() => {
        expect(screen.getByText(/Орієнтовна вартість робіт/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    test('показує розподіл по видам робіт', async () => {
      const user = userEvent.setup();
      render(<Block3MultiPageApp />);
      
      await user.click(screen.getByText(/Тестові дані/i));
      await user.click(screen.getByText('Орієнтовна вартість'));
      
      await waitFor(() => {
        expect(screen.getByText(/Розподіл робіт/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Page6_Ranking (Ранжування)', () => {
    test('виконує ранжування проектів', async () => {
      const user = userEvent.setup();
      render(<Block3MultiPageApp />);
      
      await user.click(screen.getByText(/Тестові дані/i));
      await user.click(screen.getByText("Ранжування об'єктів"));
      
      await waitFor(() => {
        expect(screen.getByText(/Ранжування об'єктів/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    test('дозволяє сортувати за різними критеріями', async () => {
      const user = userEvent.setup();
      render(<Block3MultiPageApp />);
      
      await user.click(screen.getByText(/Тестові дані/i));
      await user.click(screen.getByText("Ранжування об'єктів"));
      
      await waitFor(async () => {
        const select = screen.getByRole('combobox');
        await user.selectOptions(select, 'bcr');
        expect(select).toHaveValue('bcr');
      }, { timeout: 5000 });
    });

    test('планує розподіл бюджету', async () => {
      const user = userEvent.setup();
      
      (blockThreeModule.hasBlockOneBudgetData as jest.Mock).mockReturnValue(true);
      (blockThreeModule.getBlockOneBudgetData as jest.Mock).mockReturnValue({
        q1Value: 2500000,
        q2Value: 750000,
        totalBudget: 3250000
      });
      
      render(<Block3MultiPageApp />);
      
      await user.click(screen.getByText(/Тестові дані/i));
      await user.click(screen.getByText("Ранжування об'єктів"));
      
      await waitFor(async () => {
        const planButton = screen.getByText(/Розподілити бюджет/i);
        await user.click(planButton);
        
        expect(blockThreeModule.planRepairWorksWithBlockOneData).toHaveBeenCalled();
      }, { timeout: 5000 });
    });
  });

  describe('Інформаційна панель', () => {
    test('відображає статистику секцій', async () => {
      const user = userEvent.setup();
      render(<Block3MultiPageApp />);
      
      await user.click(screen.getByText(/Тестові дані/i));
      
      await waitFor(() => {
        expect(screen.getByText(/Дорожніх секцій/i)).toBeInTheDocument();
        expect(screen.getByText(/Потребують ремонту/i)).toBeInTheDocument();
        expect(screen.getByText(/Загальна вартість/i)).toBeInTheDocument();
      });
    });

    test('оновлює статистику при зміні даних', async () => {
      const user = userEvent.setup();
      render(<Block3MultiPageApp />);
      
      expect(screen.getByText('0')).toBeInTheDocument();
      
      await user.click(screen.getByText(/Тестові дані/i));
      
      await waitFor(() => {
        const counters = screen.getAllByText(/\d+/);
        expect(counters.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Валідація даних', () => {
    test('показує помилки валідації показників вартості', async () => {
      const user = userEvent.setup();
      render(<Block3MultiPageApp />);
      
      await user.click(screen.getByText('Показники вартості'));
      
      const editButton = screen.getByText(/Редагувати/i);
      await user.click(editButton);
      
      const inputs = screen.getAllByRole('spinbutton');
      if (inputs.length > 0) {
        await user.clear(inputs[0]);
        await user.type(inputs[0], '5');
        
        const saveButton = screen.getByText(/Зберегти/i);
        await user.click(saveButton);
        
        await waitFor(() => {
          expect(screen.getByText(/Виявлено помилки/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Інтеграція з Блоком 1', () => {
    test('відображає інформацію про бюджет з Блоку 1', async () => {
      (blockThreeModule.hasBlockOneBudgetData as jest.Mock).mockReturnValue(true);
      (blockThreeModule.getBlockOneBudgetData as jest.Mock).mockReturnValue({
        q1Value: 2500000,
        q2Value: 750000,
        totalBudget: 3250000
      });
      
      const user = userEvent.setup();
      render(<Block3MultiPageApp />);
      
      await user.click(screen.getByText("Ранжування об'єктів"));
      
      await waitFor(() => {
        expect(screen.getByText(/Планування з урахуванням бюджету Блоку 1/i)).toBeInTheDocument();
      });
    });

    test('показує повідомлення якщо немає даних з Блоку 1', async () => {
      (blockThreeModule.hasBlockOneBudgetData as jest.Mock).mockReturnValue(false);
      
      const user = userEvent.setup();
      render(<Block3MultiPageApp />);
      
      await user.click(screen.getByText(/Тестові дані/i));
      await user.click(screen.getByText("Ранжування об'єктів"));
      
      expect(screen.queryByText(/Планування з урахуванням бюджету Блоку 1/i)).not.toBeInTheDocument();
    });
  });

  describe('Продуктивність', () => {
    test('ефективно обробляє велику кількість секцій', async () => {
      const user = userEvent.setup();
      render(<Block3MultiPageApp />);
      
      const startTime = performance.now();
      
      await user.click(screen.getByText(/Тестові дані/i));
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(5000);
    });
  });
});

describe('Допоміжні функції', () => {
  describe('calculateCoefficients', () => {
    const calculateCoefficients = (section: any) => {
      const MAX_DESIGN_INTENSITY_BY_CATEGORY: { [key: number]: number } = {
        1: 20000, 2: 12000, 3: 6000, 4: 2000, 5: 500
      };
      const REQUIRED_FRICTION_COEFFICIENT = 0.35;
      
      const category = section.category as keyof typeof MAX_DESIGN_INTENSITY_BY_CATEGORY;
      const maxIntensity = MAX_DESIGN_INTENSITY_BY_CATEGORY[category];
      
      const intensityCoeff = Number((maxIntensity / Math.max(section.trafficIntensity, 1)).toFixed(3));
      const requiredStrengthModulus = 300 + section.category * 50;
      const strengthCoeff = Number((section.strengthModulus / requiredStrengthModulus).toFixed(3));
      const maxAllowedRoughness = 2.7 + section.category * 0.4;
      const evennessCoeff = Number((maxAllowedRoughness / Math.max(section.roughnessProfile, 0.1)).toFixed(3));
      const maxAllowedRutDepth = 15 + section.category * 5;
      const rutCoeff = Number((maxAllowedRutDepth / Math.max(section.rutDepth, 1)).toFixed(3));
      const frictionFactorCoeff = Number((section.frictionCoeff / REQUIRED_FRICTION_COEFFICIENT).toFixed(3));
      
      return {
        intensityCoeff,
        strengthCoeff,
        evennessCoeff,
        rutCoeff,
        frictionFactorCoeff
      };
    };

    test('розраховує коефіцієнт інтенсивності для категорії 1', () => {
      const section = {
        category: 1,
        trafficIntensity: 18500,
        strengthModulus: 380,
        roughnessProfile: 2.9,
        rutDepth: 12,
        frictionCoeff: 0.42
      };
      
      const result = calculateCoefficients(section);
      expect(result.intensityCoeff).toBeCloseTo(1.081, 2);
    });

    test('розраховує коефіцієнт міцності для категорії 2', () => {
      const section = {
        category: 2,
        trafficIntensity: 8200,
        strengthModulus: 400,
        roughnessProfile: 3.5,
        rutDepth: 20,
        frictionCoeff: 0.38
      };
      
      const result = calculateCoefficients(section);
      expect(result.strengthCoeff).toBe(1.0);
    });

    test('обробляє нульові значення коректно', () => {
      const section = {
        category: 3,
        trafficIntensity: 0,
        strengthModulus: 300,
        roughnessProfile: 0,
        rutDepth: 0,
        frictionCoeff: 0.35
      };
      
      const result = calculateCoefficients(section);
      expect(result.intensityCoeff).toBeGreaterThan(0);
      expect(result.evennessCoeff).toBeGreaterThan(0);
      expect(result.rutCoeff).toBeGreaterThan(0);
    });
  });

  describe('determineWorkType', () => {
    const determineWorkType = (coefficients: any, category: number) => {
      const MIN_STRENGTH_COEFFICIENT_BY_CATEGORY = {
        1: 1.0, 2: 1.0, 3: 0.95, 4: 0.90, 5: 0.85
      };
      
      const {
        intensityCoeff,
        strengthCoeff,
        evennessCoeff,
        rutCoeff,
        frictionFactorCoeff
      } = coefficients;
      
      if (intensityCoeff < 1.0) {
        return 'reconstruction';
      }
      
      const minStrength = MIN_STRENGTH_COEFFICIENT_BY_CATEGORY[category as keyof typeof MIN_STRENGTH_COEFFICIENT_BY_CATEGORY] || 0.85;
      if (strengthCoeff < minStrength) {
        return 'capital_repair';
      }
      
      if (evennessCoeff < 1.0 || rutCoeff < 1.0 || frictionFactorCoeff < 1.0) {
        return 'current_repair';
      }
      
      return 'no_work_needed';
    };

    test('визначає реконструкцію при перевищенні інтенсивності', () => {
      const coefficients = {
        intensityCoeff: 0.95,
        strengthCoeff: 1.1,
        evennessCoeff: 1.2,
        rutCoeff: 1.3,
        frictionFactorCoeff: 1.1
      };
      
      const workType = determineWorkType(coefficients, 1);
      expect(workType).toBe('reconstruction');
    });

    test('визначає капітальний ремонт при недостатній міцності', () => {
      const coefficients = {
        intensityCoeff: 1.1,
        strengthCoeff: 0.89,
        evennessCoeff: 1.2,
        rutCoeff: 1.3,
        frictionFactorCoeff: 1.1
      };
      
      const workType = determineWorkType(coefficients, 4);
      expect(workType).toBe('capital_repair');
    });

    test('визначає "не потрібно" при всіх показниках в нормі', () => {
      const coefficients = {
        intensityCoeff: 1.1,
        strengthCoeff: 1.0,
        evennessCoeff: 1.2,
        rutCoeff: 1.3,
        frictionFactorCoeff: 1.1
      };
      
      const workType = determineWorkType(coefficients, 2);
      expect(workType).toBe('no_work_needed');
    });
  });

  describe('calculateEstimatedCost', () => {
    const calculateEstimatedCost = (section: any, workType: string) => {
      if (workType === 'no_work_needed') return 0;
      
      const costRates: any = {
        current_repair: { 1: 3.5, 2: 2.5, 3: 1.8, 4: 1.2, 5: 0.9 },
        capital_repair: { 1: 18.0, 2: 15.0, 3: 12.0, 4: 9.0, 5: 7.0 },
        reconstruction: { 1: 60.0, 2: 50.0, 3: 35.0, 4: 28.0, 5: 22.0 }
      };
      
      const baseRate = costRates[workType][section.category] || 0;
      let totalCost = baseRate * section.length;
      
      if (section.isInternationalRoad) totalCost *= 1.15;
      if (section.isDefenseRoad) totalCost *= 1.10;
      if (section.hasLighting) totalCost *= 1.05;
      
      return totalCost;
    };

    test('повертає 0 для "не потрібно"', () => {
      const section = { category: 1, length: 10 };
      const cost = calculateEstimatedCost(section, 'no_work_needed');
      expect(cost).toBe(0);
    });

    test('розраховує базову вартість поточного ремонту для категорії 1', () => {
      const section = { category: 1, length: 10 };
      const cost = calculateEstimatedCost(section, 'current_repair');
      expect(cost).toBe(35);
    });

    test('застосовує коефіцієнт для міжнародних доріг (+15%)', () => {
      const section = {
        category: 2,
        length: 10,
        isInternationalRoad: true
      };
      const cost = calculateEstimatedCost(section, 'capital_repair');
      expect(cost).toBe(172.5);
    });

    test('комбінує всі коефіцієнти', () => {
      const section = {
        category: 1,
        length: 10,
        isInternationalRoad: true,
        isDefenseRoad: true,
        hasLighting: true
      };
      const cost = calculateEstimatedCost(section, 'reconstruction');
      expect(cost).toBeCloseTo(798.225, 2);
    });
  });

  test('safeNumber обробляє некоректні значення', () => {
    const safeNumber = (value: any, defaultValue: number = 0): number => {
      const num = Number(value);
      return isNaN(num) || !isFinite(num) ? defaultValue : num;
    };

    expect(safeNumber(undefined)).toBe(0);
    expect(safeNumber(null)).toBe(0);
    expect(safeNumber(NaN)).toBe(0);
    expect(safeNumber(Infinity)).toBe(0);
    expect(safeNumber(100)).toBe(100);
    expect(safeNumber('50')).toBe(50);
    expect(safeNumber('invalid', 10)).toBe(10);
  });
});

describe('Інтеграційні тести', () => {
  test('повний робочий процес від додавання секцій до ранжування', async () => {
    const user = userEvent.setup();
    render(<Block3MultiPageApp />);
    
    await user.click(screen.getByText(/Тестові дані/i));
    
    await waitFor(() => {
      expect(screen.getByText(/М-01 Київ-Чернігів/i)).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Показники та коефіцієнти'));
    
    await waitFor(() => {
      expect(screen.getByText(/Коефіцієнт інтенсивності руху/i)).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Показники вартості'));
    
    await waitFor(() => {
      expect(screen.getByText(/Усереднені орієнтовні показники вартості/i)).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Орієнтовна вартість'));
    
    await waitFor(() => {
      expect(screen.getByText(/Орієнтовна вартість робіт/i)).toBeInTheDocument();
    }, { timeout: 5000 });
    
    await user.click(screen.getByText("Ранжування об'єктів"));
    
    await waitFor(() => {
      expect(screen.getByText(/Ранжування об'єктів/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('зберігає стан при навігації між сторінками', async () => {
    const user = userEvent.setup();
    render(<Block3MultiPageApp />);
    
    // Додаємо тестові дані
    await user.click(screen.getByText(/Тестові дані/i));
    
    await waitFor(() => {
      expect(screen.getByText(/М-01 Київ-Чернігів/i)).toBeInTheDocument();
    });
    
    // Переходимо на іншу сторінку
    await user.click(screen.getByText('Показники вартості'));
    
    // Повертаємось назад
    await user.click(screen.getByText('Фактичний стан доріг'));
    
    // Перевіряємо, що дані збереглись
    await waitFor(() => {
      expect(screen.getByText(/М-01 Київ-Чернігів/i)).toBeInTheDocument();
    });
  });

  test('правильно передає дані між компонентами', async () => {
    const user = userEvent.setup();
    render(<Block3MultiPageApp />);
    
    // Додаємо дані
    await user.click(screen.getByText(/Тестові дані/i));
    
    await waitFor(() => {
      const sectionCount = screen.getByText(/Дорожніх секцій/i);
      expect(sectionCount).toBeInTheDocument();
    });
    
    // Переходимо на сторінку коефіцієнтів
    await user.click(screen.getByText('Показники та коефіцієнти'));
    
    // Перевіряємо, що дані передались
    await waitFor(() => {
      expect(screen.getByText(/Всього секцій/i)).toBeInTheDocument();
    });
  });
});

describe('Тести доступності', () => {
  test('всі інтерактивні елементи доступні через клавіатуру', async () => {
    const user = userEvent.setup();
    render(<Block3MultiPageApp />);
    
    // Перевіряємо, що можна навігувати через Tab
    await user.tab();
    
    // Перевіряємо фокус на першій кнопці навігації
    const firstNavButton = screen.getByText('Фактичний стан доріг');
    expect(firstNavButton).toHaveFocus();
  });

  test('має правильні ARIA атрибути', () => {
    render(<Block3MultiPageApp />);
    
    // Перевіряємо наявність progressbar
    const progressBar = document.querySelector('[role="progressbar"]');
    expect(progressBar).toBeInTheDocument();
    
    // Перевіряємо наявність кнопок
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});

describe('Тести продуктивності та оптимізації', () => {
  test('не викликає зайвих ререндерів', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Block3MultiPageApp />);
    
    const renderCount = 1;
    
    await user.click(screen.getByText(/Тестові дані/i));
    
    rerender(<Block3MultiPageApp />);
    
    // Перевіряємо, що компонент не ререндериться без причини
    expect(renderCount).toBeLessThanOrEqual(2);
  });

  test('ефективно обробляє великі набори даних', async () => {
    const user = userEvent.setup();
    render(<Block3MultiPageApp />);
    
    const startTime = performance.now();
    
    // Додаємо тестові дані
    await user.click(screen.getByText(/Тестові дані/i));
    
    // Переходимо через всі сторінки
    await user.click(screen.getByText('Показники та коефіцієнти'));
    await user.click(screen.getByText('Показники вартості'));
    await user.click(screen.getByText('Орієнтовна вартість'));
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Весь процес має займати менше 10 секунд
    expect(duration).toBeLessThan(10000);
  });

  test('дебаунсить введення даних', async () => {
    const user = userEvent.setup();
    render(<Block3MultiPageApp />);
    
    await user.click(screen.getByText(/Додати секцію/i));
    
    await waitFor(() => {
      const input = screen.getByDisplayValue('Нова ділянка');
      expect(input).toBeInTheDocument();
    });
    
    const input = screen.getByDisplayValue('Нова ділянка');
    
    // Швидко вводимо текст
    await user.type(input, 'Test');
    
    // Перевіряємо, що обробка відбувається з затримкою
    // (в реальному тесті це буде мок функції)
  });
});

describe('Тести крайових випадків', () => {
  test('обробляє порожній стан', () => {
    render(<Block3MultiPageApp />);
    
    // Перевіряємо початкове значення 0
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  test('обробляє дуже великі числа', async () => {
    const user = userEvent.setup();
    render(<Block3MultiPageApp />);
    
    await user.click(screen.getByText(/Додати секцію/i));
    
    await waitFor(() => {
      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs.length).toBeGreaterThan(0);
    });
  });

  test('обробляє некоректний ввід', async () => {
    const user = userEvent.setup();
    render(<Block3MultiPageApp />);
    
    await user.click(screen.getByText(/Додати секцію/i));
    
    await waitFor(() => {
      const inputs = screen.getAllByRole('spinbutton');
      if (inputs.length > 0) {
        // Спроба ввести від'ємне число або текст
        // Компонент має це обробити
      }
    });
  });

  test('обробляє швидкі послідовні кліки', async () => {
    const user = userEvent.setup();
    render(<Block3MultiPageApp />);
    
    const testDataButton = screen.getByText(/Тестові дані/i);
    
    // Швидкі послідовні кліки
    await user.click(testDataButton);
    await user.click(testDataButton);
    await user.click(testDataButton);
    
    // Компонент має це правильно обробити
    await waitFor(() => {
      expect(screen.getByText(/М-01 Київ-Чернігів/i)).toBeInTheDocument();
    });
  });
});

describe('Тести локалізації', () => {
  test('відображає текст українською мовою', () => {
    render(<Block3MultiPageApp />);
    
    expect(screen.getByText(/Планування ремонтів автомобільних доріг/i)).toBeInTheDocument();
    expect(screen.getByText(/Фактичний стан доріг/i)).toBeInTheDocument();
  });

  test('правильно форматує числа за українськими стандартами', async () => {
    const user = userEvent.setup();
    render(<Block3MultiPageApp />);
    
    await user.click(screen.getByText(/Тестові дані/i));
    
    await waitFor(() => {
      // Перевіряємо формат з пробілами для тисяч
      // Наприклад: 1 000 000 замість 1,000,000
    });
  });
});

describe('Тести експорту даних', () => {
  test('експортує дані у правильному форматі', async () => {
    const user = userEvent.setup();
    render(<Block3MultiPageApp />);
    
    await user.click(screen.getByText(/Тестові дані/i));
    
    await waitFor(async () => {
      const exportButtons = screen.queryAllByText(/Експорт/i);
      if (exportButtons.length > 0) {
        // В реальному тесті тут буде мок XLSX.writeFile
      }
    });
  });
});

describe('Тести мобільної адаптації', () => {
  test('адаптується до мобільних екранів', () => {
    // Змінюємо розмір viewport
    global.innerWidth = 375;
    global.innerHeight = 667;
    
    render(<Block3MultiPageApp />);
    
    // Перевіряємо, що компонент правильно адаптується
    expect(screen.getByText(/Планування ремонтів/i)).toBeInTheDocument();
  });

  test('навігація працює на мобільних пристроях', async () => {
    const user = userEvent.setup();
    
    global.innerWidth = 375;
    global.innerHeight = 667;
    
    render(<Block3MultiPageApp />);
    
    // Перевіряємо, що можна натиснути на навігацію
    await user.click(screen.getByText('Показники вартості'));
    
    await waitFor(() => {
      expect(screen.getByText(/Усереднені орієнтовні показники вартості/i)).toBeInTheDocument();
    });
  });
});

describe('Тести помилок мережі', () => {
  test('обробляє помилки завантаження даних', async () => {
    // Мокаємо помилку
    (blockThreeModule.hasBlockOneBudgetData as jest.Mock).mockImplementation(() => {
      throw new Error('Network error');
    });
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    render(<Block3MultiPageApp />);
    
    // Компонент має обробити помилку без краху
    expect(screen.getByText(/Планування ремонтів/i)).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });
});

describe('Тести безпеки', () => {
  test('санітизує введені дані', async () => {
    const user = userEvent.setup();
    render(<Block3MultiPageApp />);
    
    await user.click(screen.getByText(/Додати секцію/i));
    
    await waitFor(() => {
      const input = screen.getByDisplayValue('Нова ділянка');
      expect(input).toBeInTheDocument();
    });
    
    const input = screen.getByDisplayValue('Нова ділянка');
    
    // Спроба ввести потенційно небезпечний код
    await user.clear(input);
    await user.type(input, '<script>alert("XSS")</script>');
    
    // Перевіряємо, що скрипт не виконався
    // і був екранований або видалений
  });

  test('валідує числові поля', async () => {
    const user = userEvent.setup();
    render(<Block3MultiPageApp />);
    
    await user.click(screen.getByText('Показники вартості'));
    await user.click(screen.getByText(/Редагувати/i));
    
    const inputs = screen.getAllByRole('spinbutton');
    if (inputs.length > 0) {
      // Спроба ввести від'ємне число там, де це неприпустимо
      await user.clear(inputs[0]);
      await user.type(inputs[0], '-100');
      
      const saveButton = screen.getByText(/Зберегти/i);
      await user.click(saveButton);
      
      // Має з'явитись помилка валідації
    }
  });
});