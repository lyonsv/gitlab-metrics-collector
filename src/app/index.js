import React, { useState, useCallback, useMemo } from 'react';
import { Upload } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import Plotly from 'plotly.js';

const MONTHS_ORDER = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const parseMonthYear = (key) => {
  const parts = key.split(/[-\s]/);
  const monthStr = parts[0].substring(0, 3);
  const month = monthStr.charAt(0).toUpperCase() + monthStr.slice(1).toLowerCase();
  
  let year = parts.find(part => !isNaN(part));
  if (year) {
    year = year.length === 2 ? '20' + year : year;
  }
  
  return { month, year };
};

const monthYearToString = (month, year) => {
  return year ? `${month} ${year}` : month;
};

const monthYearCompare = (a, b) => {
  if (a.year !== b.year) {
    return parseInt(a.year) - parseInt(b.year);
  }
  return MONTHS_ORDER.indexOf(a.month) - MONTHS_ORDER.indexOf(b.month);
};

const isValidValue = (value) => {
  return value !== null && value !== undefined && value !== 0 && value !== '';
};

const DataVisualizer = () => {
  const [datasets, setDatasets] = useState({
    'Discussion Count': null,
    'Lines Changed': null,
    'MR Count': null
  });
  const [selectedAuthors, setSelectedAuthors] = useState({
    'Discussion Count': [],
    'Lines Changed': [],
    'MR Count': []
  });
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState(null);
  const [activeView, setActiveView] = useState('individual');

  const determineDataType = (headers) => {
    const headerString = headers.join(' ').toLowerCase();
    if (headerString.includes('discussioncount')) return 'Discussion Count';
    if (headerString.includes('lines changed')) return 'Lines Changed';
    if (headers.some(h => h.match(/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i))) return 'MR Count';
    return 'Unknown Data';
  };

  const processCSV = useCallback((csvText) => {
    try {
      const lines = csvText.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      if (headers[0].toLowerCase() !== 'author') {
        throw new Error('First column must be Author');
      }

      const dataType = determineDataType(headers);
      if (dataType === 'Unknown Data') {
        throw new Error('Unable to determine data type from headers');
      }

      const normalizedHeaders = headers.map(header => {
        if (MONTHS_ORDER.some(month => header.toLowerCase().includes(month.toLowerCase()))) {
          const { month, year } = parseMonthYear(header);
          return monthYearToString(month, year);
        }
        return header;
      });

      const processedData = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',').map(v => v.trim());
          const rowData = { author: values[0] };
          normalizedHeaders.slice(1).forEach((header, index) => {
            const value = values[index + 1];
            rowData[header] = value === '' ? null : (parseInt(value) || 0);
          });
          return rowData;
        });

      setDatasets(prev => ({
        ...prev,
        [dataType]: processedData
      }));
      setSelectedAuthors(prev => ({
        ...prev,
        [dataType]: [processedData[0]?.author].filter(Boolean)
      }));
      setErrors(prev => ({
        ...prev,
        [dataType]: null
      }));
      setActiveTab(dataType);
      setActiveView('individual');
    } catch (err) {
      setErrors(prev => ({
        ...prev,
        upload: err.message
      }));
    }
  }, []);

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        processCSV(e.target.result);
      };
      reader.readAsText(file);
    }
  }, [processCSV]);

  const toggleAuthor = useCallback((author, dataType) => {
    setSelectedAuthors(prev => ({
      ...prev,
      [dataType]: prev[dataType].includes(author)
        ? prev[dataType].filter(a => a !== author)
        : [...prev[dataType], author]
    }));
  }, []);

  const getChartData = useCallback((data, dataType, viewType = 'individual') => {
    if (!data || !data.length) return [];
    
    const allTimePoints = Object.keys(data[0])
      .filter(key => key !== 'author')
      .map(key => {
        const { month, year } = parseMonthYear(key);
        return { month, year, original: key };
      });

    const sortedTimePoints = allTimePoints.sort(monthYearCompare);

    return sortedTimePoints.map(timePoint => {
      const point = { 
        name: timePoint.original,
        displayName: monthYearToString(timePoint.month, timePoint.year)
      };
      
      if (viewType === 'individual') {
        data.forEach(row => {
          if (selectedAuthors[dataType].includes(row.author)) {
            point[row.author] = row[timePoint.original];
          }
        });
      } else if (viewType === 'average') {
        // Calculate average including all authors (not just selected ones)
        let sum = 0;
        let validValuesCount = 0;
        
        data.forEach(row => {
          const value = row[timePoint.original];
          if (isValidValue(value)) {
            sum += value;
            validValuesCount++;
          }
        });

        if (validValuesCount > 0) {
          point.average = Math.round(sum / validValuesCount);
          point.contributorCount = validValuesCount;
        } else {
          point.average = 0;
          point.contributorCount = 0;
        }
      }

      return point;
    });
  }, [selectedAuthors]);

  const getRandomColor = (index) => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000'];
    return colors[index % colors.length];
  };

  const datasetTabs = Object.entries(datasets).filter(([_, data]) => data !== null);

  const calculateOverallStats = (data, dataType) => {
    const chartData = getChartData(data, dataType, 'average');
    const validAverages = chartData.map(point => point.average).filter(isValidValue);
    
    if (validAverages.length === 0) return null;

    return {
      min: Math.min(...validAverages),
      max: Math.max(...validAverages),
      overall: Math.round(validAverages.reduce((a, b) => a + b, 0) / validAverages.length)
    };
  };
  
  const renderVisualization = (dataType) => {
    const data = datasets[dataType];
    if (!data) return null;

    const chartData = getChartData(data, dataType, activeView);
    const stats = calculateOverallStats(data, dataType);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveView('individual')}
              className={`px-4 py-2 rounded-lg ${
                activeView === 'individual' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Individual View
            </button>
            <button
              onClick={() => setActiveView('average')}
              className={`px-4 py-2 rounded-lg ${
                activeView === 'average' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Team Average
            </button>
          </div>
        </div>

        {activeView === 'individual' && (
          <div className="flex flex-wrap gap-2">
            {data.map((row, index) => (
              <button
                key={row.author}
                onClick={() => toggleAuthor(row.author, dataType)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedAuthors[dataType].includes(row.author)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {row.author}
              </button>
            ))}
          </div>
        )}

        {activeView === 'average' && stats && (
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Min Average</div>
              <div className="text-xl font-bold">{stats.min}</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Max Average</div>
              <div className="text-xl font-bold">{stats.max}</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Overall Average</div>
              <div className="text-xl font-bold">{stats.overall}</div>
            </div>
          </div>
        )}

        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="displayName"
                angle={-45}
                textAnchor="end"
                height={70}
                interval={0}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(label) => {
                  const dataPoint = chartData.find(d => d.displayName === label);
                  return dataPoint?.displayName || label;
                }}
                formatter={(value, name, props) => {
                  if (name === 'average') {
                    const dataPoint = chartData[props.index];
                    return [`${value} (${dataPoint.contributorCount} contributors)`];
                  }
                  return [value];
                }}
              />
              <Legend />
              
              {activeView === 'individual' && selectedAuthors[dataType].map((author, index) => (
                <Line
                  key={author}
                  type="monotone"
                  dataKey={author}
                  stroke={getRandomColor(index)}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  connectNulls={false}
                />
              ))}
              
              {activeView === 'average' && (
                <Line
                  type="monotone"
                  dataKey="average"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Team Average"
                />
              )}
              
              {activeView === 'average' && stats && (
                <ReferenceLine 
                  y={stats.overall} 
                  stroke="#6b7280" 
                  strokeDasharray="3 3"
                  label={{ 
                    value: `Overall Avg: ${stats.overall}`,
                    position: 'right',
                    fill: '#6b7280'
                  }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const traces = Object.entries(datasets).map(([dataType, data]) => ({
      name: dataType,
      x: getChartData(data, dataType, 'individual').map(d => d.displayName),
      y: getChartData(data, dataType, 'individual').map(d => d[dataType] || 0),
      type: 'scatter',
      mode: 'lines+markers',
      hovertemplate: '%{y} ' + dataType + ' in %{x}<extra></extra>'
    }));

    const layout = {
      title: 'Developer Activity Over Time',
      xaxis: {
        title: 'Month',
        tickangle: -45
      },
      yaxis: {
        title: 'Number of ' + dataType
      },
      hovermode: 'closest',
      showlegend: true,
      legend: {
        x: 1,
        xanchor: 'right',
        y: 1
      },
      margin: {
        l: 50,
        r: 50,
        b: 100,
        t: 50,
        pad: 4
      }
    };

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['lasso2d', 'select2d']
    };

    Plotly.newPlot('chart', traces, layout, config);
  }, [datasets, getChartData]);

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          Developer Activity Visualizer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer flex flex-col items-center gap-4"
            >
              <Upload className="w-12 h-12 text-gray-400" />
              <span className="text-lg">Click to upload CSV files</span>
              <span className="text-sm text-gray-500">
                Upload Discussion Count, Lines Changed, or MR Count data
              </span>
            </label>
            {errors.upload && (
              <p className="text-red-500 mt-4">{errors.upload}</p>
            )}
          </div>

          {datasetTabs.length > 0 && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                {datasetTabs.map(([dataType, _]) => (
                  <TabsTrigger 
                    key={dataType} 
                    value={dataType}
                    className="flex-1"
                  >
                    {dataType}
                  </TabsTrigger>
                ))}
              </TabsList>
              {datasetTabs.map(([dataType, _]) => (
                <TabsContent key={dataType} value={dataType}>
                  {renderVisualization(dataType)}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DataVisualizer;
