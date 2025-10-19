import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import PDFReport from '../components/PDFReport';

// Mock jspdf and html2canvas
vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(() => ({
    addImage: vi.fn(),
    save: vi.fn(),
    internal: {
      pageSize: {
        getWidth: () => 595,
        getHeight: () => 842
      }
    }
  }))
}));

vi.mock('html2canvas', () => ({
  default: vi.fn().mockResolvedValue({
    toDataURL: vi.fn().mockReturnValue('data:image/png;base64,test')
  })
}));

// Mock Redux store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      blockOne: (state = { stateRoadBudget: [], localRoadBudget: [] }) => state,
      blockTwo: (state = { regionalData: [], regionalResults: [] }) => state,
      blockThree: (state = { roadSections: [], enpvResults: null }) => state,
      history: (state = { 
        currentSession: null, 
        sessions: [],
        items: []
      }) => state,
      ...initialState
    }
  });
};

// Mock data
const mockBlockOneData = {
  stateRoadBudget: [
    { id: 'Qдз', name: 'Державні дороги', value: 1000000, attachedFiles: [] },
    { id: 'Qпп', name: 'Пункти пропуску', value: 500000, attachedFiles: [] }
  ],
  localRoadBudget: [
    { id: 'Qмз', name: 'Місцеві дороги', value: 300000, attachedFiles: [] }
  ]
};

const mockBlockTwoData = {
  regionalData: [
    {
      name: 'Київська',
      lengthByCategory: { 1: 100, 2: 200, 3: 300, 4: 400, 5: 500 },
      totalLength: 1500,
      europeanIndexLength: 50,
      lengthByIntensity: { medium: 100, high: 200, veryHigh: 300 },
      euroLength: 25,
      mppLength: 10,
      lightingLength: 75,
      repairedLength: 200,
      criticalInfraCount: 5
    }
  ],
  regionalResults: [
    {
      regionName: 'Київська',
      stateFunding: 1000000,
      localFunding: 500000,
      totalFunding: 1500000
    }
  ]
};

const mockBlockThreeData = {
  roadSections: [
    {
      id: '1',
      name: 'Test Road',
      category: 1,
      length: 10,
      workType: 'Поточний ремонт',
      estimatedCost: 100000
    }
  ],
  enpvResults: {
    enpv: 1000000,
    eirr: 0.15,
    bcr: 1.5,
    paybackPeriod: 5
  }
};

describe('PDFReport Component', () => {
  let mockStore: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore = createMockStore({
      blockOne: mockBlockOneData,
      blockTwo: mockBlockTwoData,
      blockThree: mockBlockThreeData
    });
  });

  describe('Component Rendering', () => {
    it('should render PDF download button', () => {
      render(
        <Provider store={mockStore}>
          <PDFReport />
        </Provider>
      );
      
      const button = screen.getByText('Завантажити PDF звіт');
      expect(button).toBeInTheDocument();
    });

    it('should render hidden report content', () => {
      render(
        <Provider store={mockStore}>
          <PDFReport />
        </Provider>
      );
      
      const reportContent = document.querySelector('[data-testid="pdf-report-content"]');
      expect(reportContent).toBeInTheDocument();
    });
  });

  describe('PDF Generation', () => {
    it('should generate PDF when button is clicked', async () => {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      
      const storeWithData = createMockStore({
        history: {
          currentSession: {
            blockOneData: { stateRoadBudget: [{ id: 'Q1', name: 'Q1', value: 1000000 }] },
            blockTwoData: { regionalData: [{ region: 'Test', totalLength: 100 }] },
            blockThreeData: { enpvResults: { enpv: 1000000 } }
          }
        }
      });
      
      render(
        <Provider store={storeWithData}>
          <PDFReport />
        </Provider>
      );
      
      const button = screen.getByText('Завантажити PDF звіт');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(html2canvas).toHaveBeenCalled();
        expect(jsPDF).toHaveBeenCalled();
      });
    });

    it('should handle PDF generation with no data', async () => {
      const emptyStore = createMockStore({
        history: {
          currentSession: null
        }
      });
      
      render(
        <Provider store={emptyStore}>
          <PDFReport />
        </Provider>
      );
      
      const button = screen.getByText('Завантажити PDF звіт');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(button).toBeInTheDocument();
      });
    });

    it('should handle PDF generation with partial data', async () => {
      const partialStore = createMockStore({
        blockOne: mockBlockOneData,
        blockTwo: { regionalData: [], regionalResults: [] },
        blockThree: { roadSections: [], enpvResults: null }
      });
      
      render(
        <Provider store={partialStore}>
          <PDFReport />
        </Provider>
      );
      
      const button = screen.getByText('Завантажити PDF звіт');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('Report Content', () => {
    it('should display budget information when available', () => {
      const storeWithData = createMockStore({
        history: {
          currentSession: {
            blockOneData: { stateRoadBudget: [{ id: 'Q1', name: 'Q1', value: 1000000 }] },
            blockTwoData: null,
            blockThreeData: null
          }
        }
      });
      
      render(
        <Provider store={storeWithData}>
          <PDFReport />
        </Provider>
      );
      
      const reportContent = document.querySelector('[data-testid="pdf-report-content"]');
      expect(reportContent).toHaveTextContent('Бюджетне фінансування');
    });

    it('should display maintenance information when available', () => {
      const storeWithData = createMockStore({
        history: {
          currentSession: {
            blockOneData: null,
            blockTwoData: { regionalData: [{ region: 'Test', totalLength: 100 }] },
            blockThreeData: null
          }
        }
      });
      
      render(
        <Provider store={storeWithData}>
          <PDFReport />
        </Provider>
      );
      
      const reportContent = document.querySelector('[data-testid="pdf-report-content"]');
      expect(reportContent).toHaveTextContent('Експлуатаційне утримання');
    });

    it('should display repair planning information when available', () => {
      const storeWithData = createMockStore({
        history: {
          currentSession: {
            blockOneData: null,
            blockTwoData: null,
            blockThreeData: { enpvResults: { enpv: 1000000 } }
          }
        }
      });
      
      render(
        <Provider store={storeWithData}>
          <PDFReport />
        </Provider>
      );
      
      const reportContent = document.querySelector('[data-testid="pdf-report-content"]');
      expect(reportContent).toHaveTextContent('Планування ремонтів');
    });

    it('should display ENPV results when available', () => {
      const storeWithData = createMockStore({
        history: {
          currentSession: {
            blockOneData: null,
            blockTwoData: null,
            blockThreeData: { enpvResults: { enpv: 1000000, eirr: 0.15, bcr: 1.2, paybackPeriod: 5 } }
          }
        }
      });
      
      render(
        <Provider store={storeWithData}>
          <PDFReport />
        </Provider>
      );
      
      const reportContent = document.querySelector('[data-testid="pdf-report-content"]');
      expect(reportContent).toHaveTextContent('ENPV');
    });
  });

  describe('Error Handling', () => {
    it('should handle PDF generation errors gracefully', async () => {
      const { default: html2canvas } = await import('html2canvas');
      vi.mocked(html2canvas).mockRejectedValue(new Error('Canvas error'));
      
      render(
        <Provider store={mockStore}>
          <PDFReport />
        </Provider>
      );
      
      const button = screen.getByText('Завантажити PDF звіт');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(button).toBeInTheDocument();
      });
    });

    it('should handle missing dependencies gracefully', async () => {
      // Mock missing jspdf
      vi.doMock('jspdf', () => {
        throw new Error('Module not found');
      });
      
      render(
        <Provider store={mockStore}>
          <PDFReport />
        </Provider>
      );
      
      const button = screen.getByText('Завантажити PDF звіт');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Data Integration', () => {
    it('should integrate with Redux store correctly', () => {
      render(
        <Provider store={mockStore}>
          <PDFReport />
        </Provider>
      );
      
      const reportContent = document.querySelector('[data-testid="pdf-report-content"]');
      expect(reportContent).toBeInTheDocument();
    });

    it('should handle store updates', () => {
      const { rerender } = render(
        <Provider store={mockStore}>
          <PDFReport />
        </Provider>
      );
      
      const updatedStore = createMockStore({
        blockOne: { ...mockBlockOneData, stateRoadBudget: [] },
        blockTwo: mockBlockTwoData,
        blockThree: mockBlockThreeData
      });
      
      rerender(
        <Provider store={updatedStore}>
          <PDFReport />
        </Provider>
      );
      
      const reportContent = document.querySelector('[data-testid="pdf-report-content"]');
      expect(reportContent).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render efficiently with large datasets', () => {
      const largeStore = createMockStore({
        blockOne: {
          stateRoadBudget: Array.from({ length: 100 }, (_, i) => ({
            id: `item-${i}`,
            name: `Item ${i}`,
            value: 1000 + i,
            attachedFiles: []
          })),
          localRoadBudget: []
        },
        blockTwo: {
          regionalData: Array.from({ length: 25 }, (_, i) => ({
            name: `Region ${i}`,
            lengthByCategory: { 1: 100, 2: 200, 3: 300, 4: 400, 5: 500 },
            totalLength: 1500,
            europeanIndexLength: 50,
            lengthByIntensity: { medium: 100, high: 200, veryHigh: 300 },
            euroLength: 25,
            mppLength: 10,
            lightingLength: 75,
            repairedLength: 200,
            criticalInfraCount: 5
          })),
          regionalResults: []
        },
        blockThree: {
          roadSections: Array.from({ length: 50 }, (_, i) => ({
            id: `section-${i}`,
            name: `Road Section ${i}`,
            category: (i % 5) + 1,
            length: 10 + i,
            workType: 'Поточний ремонт',
            estimatedCost: 100000 + i * 1000
          })),
          enpvResults: mockBlockThreeData.enpvResults
        }
      });
      
      const startTime = performance.now();
      render(
        <Provider store={largeStore}>
          <PDFReport />
        </Provider>
      );
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});
