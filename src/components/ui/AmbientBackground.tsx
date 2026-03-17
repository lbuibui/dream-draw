import React from 'react';

export const AmbientBackground: React.FC = () => {
    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
            {/* Light mode: 纯色渐变背景 */}
            <div className="absolute inset-0 dark:hidden bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100" />
            
            {/* Dark mode: 纯色渐变背景 */}
            <div className="absolute inset-0 hidden dark:block bg-gradient-to-br from-zinc-950 via-neutral-950 to-slate-950" />
            
            {/* 静态装饰 - 无模糊 */}
            <div className="absolute top-0 -left-20 w-[300px] h-[300px] rounded-full dark:hidden bg-indigo-500/5" />
            <div className="absolute bottom-0 -right-20 w-[200px] h-[200px] rounded-full dark:hidden bg-purple-500/5" />
            
            {/* Dark mode 装饰 */}
            <div className="absolute top-0 -left-20 w-[300px] h-[300px] rounded-full hidden dark:block bg-indigo-500/5" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full hidden dark:block bg-purple-500/5" />
        </div>
    );
};
