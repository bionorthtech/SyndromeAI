import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { TimelineNavigator } from "@/components/TimelineNavigator";
import { CheckpointSettings } from "@/components/CheckpointSettings";
import { SlashCommandsManager } from "@/components/SlashCommandsManager";
import type { Session } from "@/lib/api";

interface SessionDialogsProps {
  effectiveSession: Session | null;
  projectPath: string;
  isLoading: boolean;
  showTimeline: boolean;
  showForkDialog: boolean;
  showSettings: boolean;
  showSlashCommandsSettings: boolean;
  forkSessionName: string;
  isIMEComposingRef: React.MutableRefObject<boolean>;
  messages: any[];
  timelineVersion: number;
  onTimelineClose: () => void;
  onForkDialogClose: () => void;
  onForkSessionNameChange: (name: string) => void;
  onConfirmFork: () => void;
  onSettingsClose: () => void;
  onSlashCommandsClose: () => void;
  onCheckpointSelect: () => void;
  onFork: (checkpointId: string) => void;
  onCheckpointCreated: () => void;
  onCompositionStart: () => void;
  onCompositionEnd: () => void;
}

export const SessionDialogs: React.FC<SessionDialogsProps> = ({
  effectiveSession,
  projectPath,
  isLoading,
  showTimeline,
  showForkDialog,
  showSettings,
  showSlashCommandsSettings,
  forkSessionName,
  isIMEComposingRef,
  messages,
  timelineVersion,
  onTimelineClose,
  onForkDialogClose,
  onForkSessionNameChange,
  onConfirmFork,
  onSettingsClose,
  onSlashCommandsClose,
  onCheckpointSelect,
  onFork,
  onCheckpointCreated,
  onCompositionStart,
  onCompositionEnd,
}) => {
  return (
    <>
      <AnimatePresence>
        {showTimeline && effectiveSession && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed right-0 top-0 h-full w-full sm:w-96 bg-background border-l border-border shadow-xl z-30 overflow-hidden"
          >
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="text-lg font-semibold">Session Timeline</h3>
                <Button variant="ghost" size="icon" onClick={onTimelineClose} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <TimelineNavigator
                  sessionId={effectiveSession.id}
                  projectId={effectiveSession.project_id}
                  projectPath={projectPath}
                  currentMessageIndex={messages.length - 1}
                  onCheckpointSelect={onCheckpointSelect}
                  onFork={onFork}
                  onCheckpointCreated={onCheckpointCreated}
                  refreshVersion={timelineVersion}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={showForkDialog} onOpenChange={onForkDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fork Session</DialogTitle>
            <DialogDescription>
              Create a new session branch from the selected checkpoint.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fork-name">New Session Name</Label>
              <Input
                id="fork-name"
                placeholder="e.g., Alternative approach"
                value={forkSessionName}
                onChange={(e) => onForkSessionNameChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isLoading) {
                    if (e.nativeEvent.isComposing || isIMEComposingRef.current) return;
                    onConfirmFork();
                  }
                }}
                onCompositionStart={onCompositionStart}
                onCompositionEnd={onCompositionEnd}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onForkDialogClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={onConfirmFork} disabled={isLoading || !forkSessionName.trim()}>
              Create Fork
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showSettings && effectiveSession && (
        <Dialog open={showSettings} onOpenChange={onSettingsClose}>
          <DialogContent className="max-w-2xl">
            <CheckpointSettings
              sessionId={effectiveSession.id}
              projectId={effectiveSession.project_id}
              projectPath={projectPath}
              onClose={onSettingsClose}
            />
          </DialogContent>
        </Dialog>
      )}

      {showSlashCommandsSettings && (
        <Dialog open={showSlashCommandsSettings} onOpenChange={onSlashCommandsClose}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Slash Commands</DialogTitle>
              <DialogDescription>
                Manage project-specific slash commands for {projectPath}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              <SlashCommandsManager projectPath={projectPath} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
