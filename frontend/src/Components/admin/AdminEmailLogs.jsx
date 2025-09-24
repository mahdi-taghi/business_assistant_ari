import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Mail, Search, Trash2 } from "lucide-react";

function AdminEmailLogs({ emailLogs, searchTerm, onSearchChange, onDeleteEmailLog }) {
  const filteredEmailLogs = emailLogs.filter(log => 
    log.to_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="bg-slate-900/80 border-slate-800">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Mail className="w-5 h-5" />
          لاگ ایمیل
        </h2>
      </div>
      <div className="p-6">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="جستجو در لاگ ایمیل..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white"
            />
          </div>
        </div>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {filteredEmailLogs.map((log) => (
            <div key={log.id} className="p-4 bg-slate-800/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-white">{log.to_email}</p>
                <div className="flex gap-2">
                  <Badge variant={log.status === "sent" ? "default" : "destructive"}>
                    {log.status}
                  </Badge>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDeleteEmailLog(log.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-slate-300 mb-2">{log.subject}</p>
              <p className="text-xs text-slate-500">
                {new Date(log.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export default AdminEmailLogs;
