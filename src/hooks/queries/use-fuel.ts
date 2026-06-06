import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fuelService } from '@/services/fuel-service';
import { FuelCardStats, FuelQueryParams, FuelExpensesResponse, CreateFuelDto, FuelCardsResponse } from '@/types/fuel';

export const FUEL_QUERY_KEYS = {
  all: ['fuel'] as const,
  list: (params?: FuelQueryParams) => [...FUEL_QUERY_KEYS.all, 'list', params] as const,
  stats: () => [...FUEL_QUERY_KEYS.all, 'stats'] as const,
  cards: (params?: Record<string, unknown>) => [...FUEL_QUERY_KEYS.all, 'cards', params] as const,
};

/**
 * Hook to fetch all fuel expenses
 */
export function useFuelExpensesQuery(params?: FuelQueryParams) {
  return useQuery<FuelExpensesResponse>({
    queryKey: FUEL_QUERY_KEYS.list(params),
    queryFn: () => fuelService.getAll(params),
  });
}

/**
 * Hook to create a new fuel expense
 */
export function useAddFuelMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFuelDto) => fuelService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FUEL_QUERY_KEYS.all });
    },
  });
}

/**
 * Hook to update a fuel expense
 */
export function useUpdateFuelMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateFuelDto }) => fuelService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FUEL_QUERY_KEYS.all });
    },
  });
}

/**
 * Hook to delete a fuel expense
 */
export function useDeleteFuelMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fuelService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FUEL_QUERY_KEYS.all });
    },
  });
}

/**
 * Hook to fetch fuel card statistics
 */
export function useFuelCardStatsQuery() {
  return useQuery<FuelCardStats>({
    queryKey: FUEL_QUERY_KEYS.stats(),
    queryFn: () => fuelService.getStats(),
  });
}

/**
 * Hook to add balance to fuel card
 */
export function useAddCardBalanceMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { amount: number; note?: string }) => fuelService.addCardBalance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FUEL_QUERY_KEYS.stats() });
      queryClient.invalidateQueries({ queryKey: ['fuel'] });
    },
  });
}

export function useFuelCardsQuery(params?: Record<string, unknown>) {
  return useQuery<FuelCardsResponse>({
    queryKey: FUEL_QUERY_KEYS.cards(params),
    queryFn: () => fuelService.getFuelCards(params),
  });
}

/**
 * Hook to update a fuel card balance entry
 */
export function useUpdateCardBalanceMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { amount: number; note?: string } }) => 
      fuelService.updateCardBalance(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FUEL_QUERY_KEYS.all });
    },
  });
}

/**
 * Hook to delete a fuel card balance entry
 */
export function useDeleteCardBalanceMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => fuelService.deleteCardBalance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FUEL_QUERY_KEYS.all });
    },
  });
}
