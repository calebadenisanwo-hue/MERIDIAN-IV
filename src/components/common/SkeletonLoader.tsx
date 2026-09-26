import React from 'react';
import { ModuleRoute } from '../../types';

export interface SkeletonLoaderProps {
  route?: ModuleRoute;
  className?: string;
}

export const OverviewSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse" data-testid="overview-skeleton">
      {/* 1. Hero Composite Life Score Card */}
      <div
        className="rounded-3xl p-6 md:p-8 m3-surface-card border border-[var(--md-sys-color-outline-variant)]/40 relative overflow-hidden"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 flex-1 w-full text-center md:text-left">
            <div className="h-4 w-32 rounded-full m3-skeleton mx-auto md:mx-0" />
            <div className="h-10 w-64 rounded-xl m3-skeleton mx-auto md:mx-0" />
            <div className="h-4 w-48 rounded-full m3-skeleton mx-auto md:mx-0" />
            
            <div className="flex flex-wrap gap-2 pt-2 justify-center md:justify-start">
              <div className="h-7 w-24 rounded-lg m3-skeleton" />
              <div className="h-7 w-20 rounded-lg m3-skeleton" />
              <div className="h-7 w-28 rounded-lg m3-skeleton" />
            </div>
          </div>

          {/* Life WAR / Score Ring Skeleton */}
          <div className="relative flex items-center justify-center shrink-0">
            <div className="w-36 h-36 md:w-44 md:h-44 rounded-full m3-skeleton" />
          </div>
        </div>
      </div>

      {/* 2. Today's Move Priority Action Skeleton */}
      <div
        className="rounded-2xl p-4 md:p-5 m3-surface-card border border-[var(--md-sys-color-outline-variant)]/40 flex items-center gap-4"
      >
        <div className="w-12 h-12 rounded-2xl m3-skeleton shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-28 rounded-full m3-skeleton" />
          <div className="h-5 w-4/5 rounded-lg m3-skeleton" />
        </div>
        <div className="h-10 w-24 rounded-full m3-skeleton hidden sm:block shrink-0" />
      </div>

      {/* 3. Quick Chips Skeleton */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[80, 96, 72, 110, 85].map((w, idx) => (
          <div
            key={idx}
            className="h-8 rounded-lg m3-skeleton shrink-0"
            style={{ width: `${w}px` }}
          />
        ))}
      </div>

      {/* 4. Six Core Module Pillar Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div
            key={i}
            className="rounded-2xl p-5 m3-surface-card border border-[var(--md-sys-color-outline-variant)]/40 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl m3-skeleton" />
                <div className="h-5 w-28 rounded-lg m3-skeleton" />
              </div>
              <div className="h-6 w-12 rounded-full m3-skeleton" />
            </div>

            <div className="space-y-2">
              <div className="h-4 w-full rounded-md m3-skeleton" />
              <div className="h-4 w-3/4 rounded-md m3-skeleton" />
            </div>

            {/* Progress / Status Metric Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between">
                <div className="h-3 w-16 rounded-full m3-skeleton" />
                <div className="h-3 w-10 rounded-full m3-skeleton" />
              </div>
              <div className="h-2 w-full rounded-full m3-skeleton" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const TimelineSkeleton: React.FC = () => {
  return (
    <div className="space-y-5 animate-pulse" data-testid="timeline-skeleton">
      {/* Search & Filter Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="h-12 flex-1 rounded-2xl m3-skeleton" />
        <div className="h-10 w-32 rounded-xl m3-skeleton" />
      </div>

      {/* Chips Filter Row */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[64, 88, 92, 76, 84, 100].map((w, idx) => (
          <div
            key={idx}
            className="h-8 rounded-lg m3-skeleton shrink-0"
            style={{ width: `${w}px` }}
          />
        ))}
      </div>

      {/* Timeline Stream List Skeletons */}
      <div className="space-y-3 pt-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className="rounded-2xl p-4 m3-surface-card border border-[var(--md-sys-color-outline-variant)]/40 flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl m3-skeleton shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="h-4 w-36 rounded-md m3-skeleton" />
                <div className="h-3 w-16 rounded-md m3-skeleton" />
              </div>
              <div className="h-3.5 w-full rounded-md m3-skeleton" />
              <div className="h-3.5 w-2/3 rounded-md m3-skeleton" />
              <div className="flex items-center gap-2 pt-1">
                <div className="h-5 w-16 rounded-md m3-skeleton" />
                <div className="h-5 w-20 rounded-md m3-skeleton" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const GeneralModuleSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse" data-testid="general-skeleton">
      {/* Top Banner Skeleton */}
      <div className="rounded-3xl p-6 m3-surface-card border border-[var(--md-sys-color-outline-variant)]/40 space-y-3">
        <div className="h-7 w-48 rounded-xl m3-skeleton" />
        <div className="h-4 w-72 rounded-md m3-skeleton" />
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="rounded-2xl p-4 m3-surface-card border border-[var(--md-sys-color-outline-variant)]/40 space-y-2"
          >
            <div className="h-3 w-16 rounded-full m3-skeleton" />
            <div className="h-7 w-20 rounded-lg m3-skeleton" />
          </div>
        ))}
      </div>

      {/* Main Content Area Cards */}
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="rounded-2xl p-5 m3-surface-card border border-[var(--md-sys-color-outline-variant)]/40 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-5 w-40 rounded-lg m3-skeleton" />
              <div className="h-6 w-20 rounded-full m3-skeleton" />
            </div>
            <div className="h-4 w-full rounded-md m3-skeleton" />
            <div className="h-4 w-5/6 rounded-md m3-skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ route = 'overview', className = '' }) => {
  return (
    <div className={`w-full ${className}`}>
      {route === 'overview' && <OverviewSkeleton />}
      {route === 'timeline' && <TimelineSkeleton />}
      {route !== 'overview' && route !== 'timeline' && <GeneralModuleSkeleton />}
    </div>
  );
};
