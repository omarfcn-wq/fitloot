import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Filter, X, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PenaltyFilter } from "@/hooks/useActivityHistory";

interface ActivityHistoryFiltersProps {
  activityType: string;
  setActivityType: (value: string) => void;
  penaltyFilter: PenaltyFilter;
  setPenaltyFilter: (value: PenaltyFilter) => void;
  dateFrom: Date | undefined;
  setDateFrom: (value: Date | undefined) => void;
  dateTo: Date | undefined;
  setDateTo: (value: Date | undefined) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function ActivityHistoryFilters({
  activityType,
  setActivityType,
  penaltyFilter,
  setPenaltyFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  hasActiveFilters,
  onClearFilters,
}: ActivityHistoryFiltersProps) {
  return (
    <Card className="bg-card border-border mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Filtros</CardTitle>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters} className="gap-1 text-xs">
              <X className="h-3 w-3" />
              Limpiar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Activity Type */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Tipo de actividad</Label>
            <Select value={activityType} onValueChange={setActivityType}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="running">Correr</SelectItem>
                <SelectItem value="cycling">Ciclismo</SelectItem>
                <SelectItem value="gym">Gimnasio</SelectItem>
                <SelectItem value="swimming">Natación</SelectItem>
                <SelectItem value="hiking">Senderismo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Penalty Status */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Estado de penalización</Label>
            <Select value={penaltyFilter} onValueChange={(v) => setPenaltyFilter(v as PenaltyFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="penalized">Penalizadas</SelectItem>
                <SelectItem value="not_penalized">Sin penalización</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date From */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Desde</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "PP", { locale: es }) : "Seleccionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Date To */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Hasta</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "PP", { locale: es }) : "Seleccionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
