
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle } from "lucide-react";

interface FetchLog {
  id: string;
  started_at: string;
  completed_at?: string;
  status: 'running' | 'completed' | 'failed';
  deaths_found: number;
  deaths_added: number;
  picks_scored: number;
  error_message?: string;
}

interface MonitoringTabProps {
  fetchLogs: FetchLog[];
}

export const MonitoringTab = ({ fetchLogs }: MonitoringTabProps) => {
  return (
    <Card className="bg-black/40 border-purple-800/30">
      <CardHeader>
        <CardTitle className="text-white">Fetch Logs ({fetchLogs.length})</CardTitle>
        <CardDescription className="text-gray-400">
          Monitor automated and manual celebrity death fetching operations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {fetchLogs.map((log: FetchLog) => (
            <div key={log.id} className="p-4 bg-black/20 border border-purple-800/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Badge className={
                    log.status === 'completed' ? "bg-green-600" :
                    log.status === 'failed' ? "bg-red-600" : "bg-yellow-600"
                  }>
                    {log.status === 'running' && <Clock className="h-3 w-3 mr-1" />}
                    {log.status === 'failed' && <AlertCircle className="h-3 w-3 mr-1" />}
                    {log.status}
                  </Badge>
                  <span className="text-white text-sm">
                    Started: {new Date(log.started_at).toLocaleString()}
                  </span>
                </div>
                {log.completed_at && (
                  <span className="text-gray-400 text-sm">
                    Completed: {new Date(log.completed_at).toLocaleString()}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-gray-300">
                  Deaths Found: <span className="text-white font-semibold">{log.deaths_found}</span>
                </div>
                <div className="text-gray-300">
                  Deaths Added: <span className="text-white font-semibold">{log.deaths_added}</span>
                </div>
                <div className="text-gray-300">
                  Picks Scored: <span className="text-white font-semibold">{log.picks_scored}</span>
                </div>
              </div>
              {log.error_message && (
                <div className="mt-2 p-2 bg-red-900/20 border border-red-800 rounded">
                  <p className="text-red-400 text-sm">{log.error_message}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
