import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { TimeEntry } from '../types';
import { formatTime, getTimeSince } from '../lib/timeUtils';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Play, Square, Edit, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';

interface StatusCardProps {
  activeTimeEntry: TimeEntry | null | undefined;
  isLoading: boolean;
}

export function StatusCard({ activeTimeEntry, isLoading }: StatusCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isEditingTimeEntry, setIsEditingTimeEntry] = useState(false);
  
  const isPunchedIn = !!activeTimeEntry;
  
  // Predefined list of categories
  const categoryOptions = [
    "Meeting",
    "Team Meeting",
    "Code Review",
    "Problem Solving",
    "Feature Discussion",
    "Development",
    "Documentation",
    "Research",
    "Planning",
    "Other"
  ];
  
  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (activeTimeEntry) {
      setCategory(activeTimeEntry.category || '');
      setDescription(activeTimeEntry.description || '');
    } else {
      setCategory('');
      setDescription('');
    }
  }, [activeTimeEntry, isDialogOpen]);
  
  const punchInMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/time-entries', {
        category,
        description
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Punched In",
        description: "You have successfully punched in.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/time-entries/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/daily'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/weekly'] });
      queryClient.invalidateQueries({ queryKey: ['/api/time-entries/recent'] });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to punch in. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const punchOutMutation = useMutation({
    mutationFn: async () => {
      if (!activeTimeEntry) throw new Error("No active time entry");
      const response = await apiRequest('PATCH', `/api/time-entries/${activeTimeEntry.id}`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Punched Out",
        description: "You have successfully punched out.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/time-entries/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/daily'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/weekly'] });
      queryClient.invalidateQueries({ queryKey: ['/api/time-entries/recent'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to punch out. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const updateTimeEntryMutation = useMutation({
    mutationFn: async () => {
      if (!activeTimeEntry) throw new Error("No active time entry");
      const response = await apiRequest('PATCH', `/api/time-entries/${activeTimeEntry.id}`, {
        category,
        description
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Updated",
        description: "Time entry details have been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/time-entries/active'] });
      setIsEditingTimeEntry(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update time entry. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const handlePunch = () => {
    if (isPunchedIn) {
      punchOutMutation.mutate();
    } else {
      setIsDialogOpen(true);
    }
  };
  
  const handleSubmitPunchIn = () => {
    punchInMutation.mutate();
  };
  
  const handleUpdateTimeEntry = () => {
    updateTimeEntryMutation.mutate();
  };
  
  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 rounded-md">
                  {isLoading ? (
                    <div className="h-3 w-3 rounded-full bg-gray-200 animate-pulse"></div>
                  ) : (
                    <div className={`h-3 w-3 rounded-full ${isPunchedIn ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  )}
                </div>
                <div className="ml-2 flex-1">
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="flex items-center">
                    {isLoading ? (
                      <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      <>
                        <div className={`text-lg font-semibold ${isPunchedIn ? 'text-green-600' : 'text-red-600'}`}>
                          {isPunchedIn ? 'Punched In' : 'Punched Out'}
                        </div>
                        {isPunchedIn && activeTimeEntry && (
                          <span className="ml-2 text-sm text-gray-500">
                            {getTimeSince(activeTimeEntry.clockIn)}
                          </span>
                        )}
                      </>
                    )}
                  </dd>
                </div>
              </div>
              
              {isPunchedIn && activeTimeEntry && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsEditingTimeEntry(true)}
                  disabled={isEditingTimeEntry || updateTimeEntryMutation.isPending}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
            
            {isPunchedIn && activeTimeEntry && (
              <div className="mt-4 space-y-2">
                {activeTimeEntry.category && (
                  <div>
                    <div className="text-xs font-medium text-gray-500">Category</div>
                    <div className="text-sm font-medium">{activeTimeEntry.category}</div>
                  </div>
                )}
                
                {activeTimeEntry.description && (
                  <div>
                    <div className="text-xs font-medium text-gray-500">Description</div>
                    <div className="text-sm">{activeTimeEntry.description}</div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <Button
              onClick={handlePunch}
              disabled={punchInMutation.isPending || punchOutMutation.isPending || isLoading}
              variant={isPunchedIn ? "destructive" : "default"}
              className="w-full py-6 text-lg font-bold"
              size="lg"
            >
              {punchInMutation.isPending || punchOutMutation.isPending ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <>
                  {isPunchedIn ? 
                    <Square className="mr-2 h-5 w-5" /> : 
                    <Play className="mr-2 h-5 w-5" />
                  }
                </>
              )}
              <span>{isPunchedIn ? 'PUNCH OUT' : 'PUNCH IN'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Punch In Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Time Entry Details</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="category" className="text-sm font-medium">
                Category
              </label>
              <Select
                value={category}
                onValueChange={setCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description (optional)
              </label>
              <Textarea
                id="description"
                placeholder="What are you working on?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitPunchIn}
              disabled={punchInMutation.isPending}
            >
              {punchInMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Punch In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Time Entry Dialog */}
      <Dialog open={isEditingTimeEntry} onOpenChange={setIsEditingTimeEntry}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Time Entry</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="edit-category" className="text-sm font-medium">
                Category
              </label>
              <Select
                value={category}
                onValueChange={setCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="edit-description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="edit-description"
                placeholder="What are you working on?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingTimeEntry(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateTimeEntry}
              disabled={updateTimeEntryMutation.isPending}
            >
              {updateTimeEntryMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
