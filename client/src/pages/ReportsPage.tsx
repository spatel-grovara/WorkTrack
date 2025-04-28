import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { WeeklyStats, TimeEntry } from '@/types';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDuration, formatFullDate, formatTime } from '@/lib/timeUtils';
import { Loader2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Using the autoTable function imported from jspdf-autotable

export default function ReportsPage() {
  const { user, isLoading: isUserLoading } = useAuth();
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState<'current' | 'previous'>('current');
  
  // Determine date range based on selected period
  const today = new Date();
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday as week start
  const currentWeekEnd = endOfWeek(today, { weekStartsOn: 1 });
  
  const previousWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
  const previousWeekEnd = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
  
  const startDate = selectedPeriod === 'current' 
    ? format(currentWeekStart, 'yyyy-MM-dd')
    : format(previousWeekStart, 'yyyy-MM-dd');
  
  // Query weekly stats for the selected period
  const { 
    data: weeklyStats,
    isLoading: isWeeklyStatsLoading 
  } = useQuery<WeeklyStats>({
    queryKey: ['/api/stats/weekly', startDate],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user,
  });
  
  // Generate PDF report
  const generatePDF = () => {
    if (!weeklyStats || !user) return;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Set title and header
    const title = `Time Report: ${selectedPeriod === 'current' ? 'Current Week' : 'Previous Week'}`;
    const dateRange = selectedPeriod === 'current'
      ? `${format(currentWeekStart, 'MMM dd')} - ${format(currentWeekEnd, 'MMM dd, yyyy')}`
      : `${format(previousWeekStart, 'MMM dd')} - ${format(previousWeekEnd, 'MMM dd, yyyy')}`;
    
    // Add logo or company name
    doc.setFontSize(20);
    doc.setTextColor(41, 98, 255);
    doc.text("TimeTrack", pageWidth / 2, 15, { align: "center" });
    
    // Add report title
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(title, pageWidth / 2, 25, { align: "center" });
    
    // Add date range
    doc.setFontSize(12);
    doc.text(dateRange, pageWidth / 2, 32, { align: "center" });
    
    // Add employee info
    doc.setFontSize(12);
    doc.text(`Employee: ${user.displayName}`, 14, 45);
    doc.text(`Generated on: ${format(new Date(), 'MMMM dd, yyyy')}`, 14, 52);
    
    // Add summary section
    doc.setFontSize(14);
    doc.setTextColor(41, 98, 255);
    doc.text("Summary", 14, 65);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Hours: ${formatDuration(weeklyStats.totalHours * 60 * 60 * 1000)}`, 14, 75);
    doc.text(`Remaining Hours: ${formatDuration(weeklyStats.remainingHours * 60 * 60 * 1000)}`, 14, 82);
    doc.text(`Weekly Target: 40h 0m`, 14, 89);
    
    // Create table with daily data
    const tableData = weeklyStats.dailyStats.map(day => [
      format(new Date(day.date), 'EEEE, MMM dd'),
      formatDuration(day.totalHours * 60 * 60 * 1000),
      day.entries.length > 0 ? formatTime(day.entries[0].clockIn) : '-',
      day.entries.length > 0 && day.entries[day.entries.length - 1].clockOut 
        ? formatTime(day.entries[day.entries.length - 1].clockOut)
        : '-',
      day.entries.length.toString()
    ]);
    
    // Add the daily summary table
    autoTable(doc, {
      startY: 100,
      head: [['Day', 'Hours', 'First In', 'Last Out', 'Entries']],
      body: tableData,
      headStyles: { 
        fillColor: [41, 98, 255],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: { fillColor: [240, 240, 250] },
      styles: { fontSize: 10 }
    });
    
    // Add detailed entries with categories
    let detailsY = (doc as any).lastAutoTable?.finalY + 15 || 200;
    
    doc.setFontSize(14);
    doc.setTextColor(41, 98, 255);
    doc.text("Detailed Time Entries", 14, detailsY);
    detailsY += 10;
    
    // Create detailed entries data with categories and descriptions
    const detailedData: any[] = [];
    
    weeklyStats.dailyStats.forEach(day => {
      day.entries.forEach(entry => {
        detailedData.push([
          format(new Date(day.date), 'EEE, MMM dd'),
          formatTime(entry.clockIn),
          entry.clockOut ? formatTime(entry.clockOut) : 'Active',
          entry.duration ? formatDuration(entry.duration) : 'In progress',
          entry.category || '-',
          entry.description || '-'
        ]);
      });
    });
    
    // Add the detailed entries table
    autoTable(doc, {
      startY: detailsY,
      head: [['Date', 'Clock In', 'Clock Out', 'Duration', 'Category', 'Description']],
      body: detailedData,
      headStyles: { 
        fillColor: [41, 98, 255],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: { fillColor: [240, 240, 250] },
      styles: { fontSize: 9 },
      columnStyles: {
        5: { cellWidth: 50 } // Make description column wider
      }
    });
    
    // Add footer
    const finalY = (doc as any).lastAutoTable?.finalY || 200;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("This report was generated automatically from TimeTrack.", 14, finalY + 15);
    doc.text(`Report Period: ${dateRange}`, 14, finalY + 22);
    
    // Save the PDF
    const filename = `${user.username}_time_report_${selectedPeriod === 'current' ? 'current' : 'previous'}_week.pdf`;
    doc.save(filename);
    
    toast({
      title: "PDF Report Generated",
      description: `Your ${selectedPeriod} week report has been downloaded.`,
    });
  };
  
  return (
    <Layout user={user} isLoading={isUserLoading}>
      <div className="container py-10 mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Time Reports</h1>
          <p className="text-gray-500 mt-2">
            Generate and download reports of your tracked time
          </p>
        </div>
        
        <Tabs
          defaultValue="current"
          onValueChange={(value) => setSelectedPeriod(value as 'current' | 'previous')}
          className="w-full"
        >
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="current">Current Week</TabsTrigger>
              <TabsTrigger value="previous">Previous Week</TabsTrigger>
            </TabsList>
            
            <Button 
              onClick={generatePDF} 
              disabled={isWeeklyStatsLoading || !weeklyStats}
              className="ml-auto"
            >
              {isWeeklyStatsLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Download PDF
            </Button>
          </div>
          
          <TabsContent value="current">
            <Card>
              <CardHeader>
                <CardTitle>Current Week Report</CardTitle>
                <CardDescription>
                  {format(currentWeekStart, 'MMMM dd')} - {format(currentWeekEnd, 'MMMM dd, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isWeeklyStatsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : weeklyStats ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-lg shadow border">
                        <h3 className="text-sm font-medium text-gray-500">Total Hours</h3>
                        <p className="text-2xl font-bold mt-1">
                          {formatDuration(weeklyStats.totalHours * 60 * 60 * 1000)}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow border">
                        <h3 className="text-sm font-medium text-gray-500">Remaining Hours</h3>
                        <p className="text-2xl font-bold mt-1">
                          {formatDuration(weeklyStats.remainingHours * 60 * 60 * 1000)}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow border">
                        <h3 className="text-sm font-medium text-gray-500">Progress</h3>
                        <p className="text-2xl font-bold mt-1">
                          {weeklyStats.progressPercentage.toFixed(0)}%
                        </p>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First In</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Out</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {weeklyStats.dailyStats.map((day, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="py-4 px-4 text-sm font-medium text-gray-900">
                                {format(new Date(day.date), 'EEEE, MMM dd')}
                              </td>
                              <td className="py-4 px-4 text-sm text-gray-500">
                                {formatDuration(day.totalHours * 60 * 60 * 1000)}
                              </td>
                              <td className="py-4 px-4 text-sm text-gray-500">
                                {day.entries.length > 0 ? formatTime(day.entries[0].clockIn) : '-'}
                              </td>
                              <td className="py-4 px-4 text-sm text-gray-500">
                                {day.entries.length > 0 && day.entries[day.entries.length - 1].clockOut 
                                  ? formatTime(day.entries[day.entries.length - 1].clockOut)
                                  : '-'}
                              </td>
                              <td className="py-4 px-4 text-sm text-gray-500">
                                {day.isToday && !day.entries.some(e => e.isActive) ? 'Working today' : 
                                 day.entries.some(e => e.isActive) ? 'Clocked in' : 
                                 day.totalHours > 0 ? 'Completed' : 'No data'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No data available for this week.</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t bg-gray-50 px-6 py-3">
                <p className="text-xs text-gray-500">
                  Data shown is based on your tracked time entries for the current week.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="previous">
            <Card>
              <CardHeader>
                <CardTitle>Previous Week Report</CardTitle>
                <CardDescription>
                  {format(previousWeekStart, 'MMMM dd')} - {format(previousWeekEnd, 'MMMM dd, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isWeeklyStatsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : weeklyStats ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-lg shadow border">
                        <h3 className="text-sm font-medium text-gray-500">Total Hours</h3>
                        <p className="text-2xl font-bold mt-1">
                          {formatDuration(weeklyStats.totalHours * 60 * 60 * 1000)}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow border">
                        <h3 className="text-sm font-medium text-gray-500">Remaining Hours</h3>
                        <p className="text-2xl font-bold mt-1">
                          {formatDuration(weeklyStats.remainingHours * 60 * 60 * 1000)}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow border">
                        <h3 className="text-sm font-medium text-gray-500">Progress</h3>
                        <p className="text-2xl font-bold mt-1">
                          {weeklyStats.progressPercentage.toFixed(0)}%
                        </p>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First In</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Out</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {weeklyStats.dailyStats.map((day, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="py-4 px-4 text-sm font-medium text-gray-900">
                                {format(new Date(day.date), 'EEEE, MMM dd')}
                              </td>
                              <td className="py-4 px-4 text-sm text-gray-500">
                                {formatDuration(day.totalHours * 60 * 60 * 1000)}
                              </td>
                              <td className="py-4 px-4 text-sm text-gray-500">
                                {day.entries.length > 0 ? formatTime(day.entries[0].clockIn) : '-'}
                              </td>
                              <td className="py-4 px-4 text-sm text-gray-500">
                                {day.entries.length > 0 && day.entries[day.entries.length - 1].clockOut 
                                  ? formatTime(day.entries[day.entries.length - 1].clockOut)
                                  : '-'}
                              </td>
                              <td className="py-4 px-4 text-sm text-gray-500">
                                {day.totalHours > 0 ? 'Completed' : 'No data'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No data available for the previous week.</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t bg-gray-50 px-6 py-3">
                <p className="text-xs text-gray-500">
                  Data shown is based on your tracked time entries for the previous week.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}