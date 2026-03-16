"use client";
import React, { useState, useEffect } from "react";
import { Button, Input, Select } from "@doctorproject/react";
import { PostStatus, DropdownOption } from "@/lib/types";

interface SchedulePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (date: string, status: PostStatus) => void;
  initialDate?: string;
  initialStatus?: PostStatus;
}

const statusOptions: DropdownOption[] = [
  {
    id: "draft",
    value: "draft",
    label: "Draft",
    category: "Status",
    description: "Post is a work in progress.",
    exampleSnippet: "",
    useCases: [],
  },
  {
    id: "to-review",
    value: "to-review",
    label: "To Review",
    category: "Status",
    description: "Post is ready for review.",
    exampleSnippet: "",
    useCases: [],
  },
  {
    id: "to-plan",
    value: "to-plan",
    label: "To Plan",
    category: "Status",
    description: "Post is ready for planning.",
    exampleSnippet: "",
    useCases: [],
  },
  {
    id: "to-publish",
    value: "to-publish",
    label: "To Publish",
    category: "Status",
    description: "Post is ready to be published.",
    exampleSnippet: "",
    useCases: [],
  },
  {
    id: "scheduled",
    value: "scheduled",
    label: "Scheduled",
    category: "Status",
    description: "Post is scheduled for a future date.",
    exampleSnippet: "",
    useCases: [],
  },
  {
    id: "published",
    value: "published",
    label: "Published",
    category: "Status",
    description: "Post has been published.",
    exampleSnippet: "",
    useCases: [],
  },
];

const SchedulePostModal: React.FC<SchedulePostModalProps> = ({
  isOpen,
  onClose,
  onSchedule,
  initialDate,
  initialStatus = "scheduled",
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate ?? new Date().toISOString().split("T")[0],
  );
  const [selectedStatus, setSelectedStatus] =
    useState<PostStatus>(initialStatus);

  useEffect(() => {
    if (isOpen) {
      setSelectedDate(initialDate ?? new Date().toISOString().split("T")[0]);
      setSelectedStatus(initialStatus);
    }
  }, [isOpen, initialDate, initialStatus]);

  if (!isOpen) return null;

  const handleSchedule = () => {
    onSchedule(selectedDate, selectedStatus);
  };

  return (
    <div className="drp-overlay">
      <div className="drp-modal w-full max-w-md">
        <div className="drp-modal__header">
          <h2 className="drp-modal__title">Schedule Post</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            aria-label="Close"
          >
            ✕
          </Button>
        </div>

        <div className="drp-modal__body">
          <div className="mb-4">
            <Input
              label="Date"
              type="date"
              id="schedule-date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <Select
              label="Status"
              id="schedule-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as PostStatus)}
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="drp-modal__footer">
          <Button onClick={onClose} variant="secondary">
            Cancel
          </Button>
          <Button onClick={() => handleSchedule()} variant="primary">
            Schedule
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SchedulePostModal;
