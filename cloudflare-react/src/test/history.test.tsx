import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import History from '../components/view/history';
import { historyService } from '../service/historyService';

// Mock history service
vi.mock('../service/historyService', () => ({
  historyService: {
    getAllSessions: vi.fn(),
    saveSession: vi.fn(),
    clearSessions: vi.fn()
  }
}));

// Mock Redux store
  const createMockStore = (initialState = {}) => {
    return configureStore({
      reducer: {
        history: (state = {
          currentSession: null,
          sessions: [
            {
              id: 'test-session-123',
              title: 'test-session-123',
              updatedAt: new Date('2024-01-01').toISOString(),
              createdAt: new Date('2024-01-01').toISOString(),
              blockOneData: {
                stateRoadBudget: [
                  {
                    id: 'Q1',
                    name: 'Q1',
                    value: 1000000,
                    attachedFiles: [
                      {
                        name: 'budget-analysis.xlsx',
                        size: 2048,
                        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        lastModified: Date.now()
                      }
                    ]
                  }
                ],
                localRoadBudget: []
              },
              blockTwoData: null,
              blockThreeData: {
                enpvResults: {
                  enpv: 1000000,
                  eirr: 0.15,
                  bcr: 1.2,
                  paybackPeriod: 5
                }
              }
            }
          ],
          items: []
        }) => state,
        ...initialState
      }
    });
  };

// Mock data
const createMockHistoryItem = (overrides = {}) => ({
  id: 'test-session-123',
  userId: 'test-user',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  isComplete: true,
  blockOneData: {
    stateRoadBudget: [
      {
        id: 'Qдз',
        name: 'Державні дороги',
        value: 1000000,
        attachedFiles: [
          {
            name: 'budget-analysis.xlsx',
            size: 2048,
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            lastModified: Date.now()
          }
        ]
      }
    ],
    localRoadBudget: [
      {
        id: 'Qмз',
        name: 'Місцеві дороги',
        value: 500000,
        attachedFiles: []
      }
    ]
  },
  blockTwoData: {
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
  },
  blockThreeData: {
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
    },
    reportText: 'Test report text',
    status: 'completed' as const
  },
  ...overrides
});

describe('History Component', () => {
  let mockStore: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore = createMockStore();
  });

  describe('Component Rendering', () => {
    it('should render history component', () => {
      vi.mocked(historyService.getAllSessions).mockResolvedValue([]);
      
      render(
        <Provider store={mockStore}>
          <History />
        </Provider>
      );
      
      expect(screen.getByText('Історія розрахунків')).toBeInTheDocument();
    });

    it('should display empty state when no history', () => {
      vi.mocked(historyService.getAllSessions).mockResolvedValue([]);
      
      render(
        <Provider store={mockStore}>
          <History />
        </Provider>
      );
      
      expect(screen.getByText('Історія порожня')).toBeInTheDocument();
    });

    it('should display history items when available', () => {
      const mockHistory = [createMockHistoryItem()];
      vi.mocked(historyService.getAllSessions).mockResolvedValue(mockHistory);
      
      render(
        <Provider store={mockStore}>
          <History />
        </Provider>
      );
      
      expect(screen.getByText('test-session-123')).toBeInTheDocument();
    });
  });

  describe('File Display', () => {
    it('should display attached files for state road budget', () => {
      const mockHistory = [createMockHistoryItem()];
      vi.mocked(historyService.getAllSessions).mockResolvedValue(mockHistory);
      
      render(
        <Provider store={mockStore}>
          <History />
        </Provider>
      );
      
      // Click on details tab
      const detailsTab = screen.getByText('Деталі сесії');
      fireEvent.click(detailsTab);
      
      expect(screen.getByText('budget-analysis.xlsx')).toBeInTheDocument();
    });

    it('should display file size correctly', () => {
      const mockHistory = [createMockHistoryItem()];
      vi.mocked(historyService.getAllSessions).mockResolvedValue(mockHistory);
      
      render(
        <Provider store={mockStore}>
          <History />
        </Provider>
      );
      
      const detailsTab = screen.getByText('Деталі сесії');
      fireEvent.click(detailsTab);
      
      expect(screen.getByText('2.0 KB')).toBeInTheDocument();
    });

    it('should handle items without attached files', () => {
      const mockHistory = [createMockHistoryItem({
        blockOneData: {
          stateRoadBudget: [
            {
              id: 'Qдз',
              name: 'Державні дороги',
              value: 1000000,
              attachedFiles: []
            }
          ],
          localRoadBudget: []
        }
      })];
      vi.mocked(historyService.getAllSessions).mockResolvedValue(mockHistory);
      
      render(
        <Provider store={mockStore}>
          <History />
        </Provider>
      );
      
      const detailsTab = screen.getByText('Деталі сесії');
      fireEvent.click(detailsTab);
      
      expect(screen.queryByText('budget-analysis.xlsx')).not.toBeInTheDocument();
    });

    it('should display multiple attached files', () => {
      const mockHistory = [createMockHistoryItem({
        blockOneData: {
          stateRoadBudget: [
            {
              id: 'Qдз',
              name: 'Державні дороги',
              value: 1000000,
              attachedFiles: [
                {
                  name: 'file1.xlsx',
                  size: 1024,
                  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                  lastModified: Date.now()
                },
                {
                  name: 'file2.pdf',
                  size: 2048,
                  type: 'application/pdf',
                  lastModified: Date.now()
                }
              ]
            }
          ],
          localRoadBudget: []
        }
      })];
      vi.mocked(historyService.getAllSessions).mockResolvedValue(mockHistory);
      
      render(
        <Provider store={mockStore}>
          <History />
        </Provider>
      );
      
      const detailsTab = screen.getByText('Деталі сесії');
      fireEvent.click(detailsTab);
      
      expect(screen.getByText('file1.xlsx')).toBeInTheDocument();
      expect(screen.getByText('file2.pdf')).toBeInTheDocument();
    });
  });

  describe('File Size Formatting', () => {
    it('should format file size in bytes', () => {
      const mockHistory = [createMockHistoryItem({
        blockOneData: {
          stateRoadBudget: [
            {
              id: 'Qдз',
              name: 'Державні дороги',
              value: 1000000,
              attachedFiles: [
                {
                  name: 'small-file.txt',
                  size: 500,
                  type: 'text/plain',
                  lastModified: Date.now()
                }
              ]
            }
          ],
          localRoadBudget: []
        }
      })];
      vi.mocked(historyService.getAllSessions).mockResolvedValue(mockHistory);
      
      render(
        <Provider store={mockStore}>
          <History />
        </Provider>
      );
      
      const detailsTab = screen.getByText('Деталі сесії');
      fireEvent.click(detailsTab);
      
      expect(screen.getByText('500 B')).toBeInTheDocument();
    });

    it('should format file size in KB', () => {
      const mockHistory = [createMockHistoryItem({
        blockOneData: {
          stateRoadBudget: [
            {
              id: 'Qдз',
              name: 'Державні дороги',
              value: 1000000,
              attachedFiles: [
                {
                  name: 'medium-file.xlsx',
                  size: 1536,
                  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                  lastModified: Date.now()
                }
              ]
            }
          ],
          localRoadBudget: []
        }
      })];
      vi.mocked(historyService.getAllSessions).mockResolvedValue(mockHistory);
      
      render(
        <Provider store={mockStore}>
          <History />
        </Provider>
      );
      
      const detailsTab = screen.getByText('Деталі сесії');
      fireEvent.click(detailsTab);
      
      expect(screen.getByText('1.5 KB')).toBeInTheDocument();
    });

    it('should format file size in MB', () => {
      const mockHistory = [createMockHistoryItem({
        blockOneData: {
          stateRoadBudget: [
            {
              id: 'Qдз',
              name: 'Державні дороги',
              value: 1000000,
              attachedFiles: [
                {
                  name: 'large-file.pdf',
                  size: 2097152,
                  type: 'application/pdf',
                  lastModified: Date.now()
                }
              ]
            }
          ],
          localRoadBudget: []
        }
      })];
      vi.mocked(historyService.getAllSessions).mockResolvedValue(mockHistory);
      
      render(
        <Provider store={mockStore}>
          <History />
        </Provider>
      );
      
      const detailsTab = screen.getByText('Деталі сесії');
      fireEvent.click(detailsTab);
      
      expect(screen.getByText('2.0 MB')).toBeInTheDocument();
    });
  });

  describe('ENPV Results Display', () => {
    it('should display ENPV results when available', () => {
      const mockHistory = [createMockHistoryItem()];
      vi.mocked(historyService.getAllSessions).mockResolvedValue(mockHistory);
      
      render(
        <Provider store={mockStore}>
          <History />
        </Provider>
      );
      
      const detailsTab = screen.getByText('Деталі сесії');
      fireEvent.click(detailsTab);
      
      expect(screen.getByText('ENPV')).toBeInTheDocument();
      expect(screen.getByText('1,000,000')).toBeInTheDocument();
    });

    it('should handle missing ENPV results', () => {
      const mockHistory = [createMockHistoryItem({
        blockThreeData: {
          roadSections: [],
          enpvResults: null,
          reportText: 'Test report',
          status: 'completed' as const
        }
      })];
      vi.mocked(historyService.getAllSessions).mockResolvedValue(mockHistory);
      
      render(
        <Provider store={mockStore}>
          <History />
        </Provider>
      );
      
      const detailsTab = screen.getByText('Деталі сесії');
      fireEvent.click(detailsTab);
      
      expect(screen.queryByText('ENPV')).not.toBeInTheDocument();
    });
  });

  describe('Data Integrity', () => {
    it('should preserve file metadata during display', () => {
      const mockHistory = [createMockHistoryItem({
        blockOneData: {
          stateRoadBudget: [
            {
              id: 'Qдз',
              name: 'Державні дороги',
              value: 1000000,
              attachedFiles: [
                {
                  name: 'test-file.xlsx',
                  size: 1024,
                  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                  lastModified: 1640995200000 // 2022-01-01
                }
              ]
            }
          ],
          localRoadBudget: []
        }
      })];
      vi.mocked(historyService.getAllSessions).mockResolvedValue(mockHistory);
      
      render(
        <Provider store={mockStore}>
          <History />
        </Provider>
      );
      
      const detailsTab = screen.getByText('Деталі сесії');
      fireEvent.click(detailsTab);
      
      expect(screen.getByText('test-file.xlsx')).toBeInTheDocument();
      expect(screen.getByText('1.0 KB')).toBeInTheDocument();
    });

    it('should handle corrupted file data gracefully', () => {
      const mockHistory = [createMockHistoryItem({
        blockOneData: {
          stateRoadBudget: [
            {
              id: 'Qдз',
              name: 'Державні дороги',
              value: 1000000,
              attachedFiles: [
                {
                  name: '',
                  size: -1,
                  type: '',
                  lastModified: NaN
                }
              ]
            }
          ],
          localRoadBudget: []
        }
      })];
      vi.mocked(historyService.getAllSessions).mockResolvedValue(mockHistory);
      
      render(
        <Provider store={mockStore}>
          <History />
        </Provider>
      );
      
      const detailsTab = screen.getByText('Деталі сесії');
      fireEvent.click(detailsTab);
      
      // Should not crash and should display something
      expect(screen.getByText('Деталі сесії')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle large history efficiently', () => {
      const largeHistory = Array.from({ length: 100 }, (_, i) => 
        createMockHistoryItem({
          id: `session-${i}`,
          timestamp: Date.now() - i * 1000,
          blockOneData: {
            stateRoadBudget: [
              {
                id: 'Qдз',
                name: 'Державні дороги',
                value: 1000000 + i,
                attachedFiles: Array.from({ length: 5 }, (_, j) => ({
                  name: `file-${i}-${j}.xlsx`,
                  size: 1024 + j * 100,
                  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                  lastModified: Date.now()
                }))
              }
            ],
            localRoadBudget: []
          }
        })
      );
      
      vi.mocked(historyService.getAllSessions).mockResolvedValue(largeHistory);
      
      const startTime = performance.now();
      render(
        <Provider store={mockStore}>
          <History />
        </Provider>
      );
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});
