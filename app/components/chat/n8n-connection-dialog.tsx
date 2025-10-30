"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { useState } from "react";

interface N8NConnectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (instanceUrl: string, apiKey: string) => void;
}

export function N8NConnectionDialog({
  isOpen,
  onClose,
  onSubmit,
}: N8NConnectionDialogProps) {
  const [instanceUrl, setInstanceUrl] = useState("");
  const [apiKey, setApiKey] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(instanceUrl, apiKey);
    setInstanceUrl("");
    setApiKey("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect to N8N</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="instanceUrl" className="text-sm font-medium">
              N8N Instance URL
            </label>
            <Input
              id="instanceUrl"
              type="url"
              placeholder="https://your-n8n-instance.com"
              className="bg-background mt-2"
              value={instanceUrl}
              onChange={(e) => setInstanceUrl(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="apiKey" className="text-sm font-medium">
              N8N API Key
            </label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Your N8N API Key"
              className="bg-background mt-2"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="special">
              Connect
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
