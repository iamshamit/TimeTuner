import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Timer, Mail, Lock, ArrowRight } from 'lucide-react';
import { authAPI } from '@/services/api';
import useAuthStore from '@/store/authStore';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuthStore();

    const from = location.state?.from?.pathname || '/dashboard';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data } = await authAPI.login({ email, password });
            login(data.data.user, data.data.accessToken);
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background Orbs */}
            <motion.div
                animate={{
                    x: [0, 50, 0],
                    y: [0, -30, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
                className="absolute -top-32 -left-32 w-96 h-96 bg-primary-500 rounded-full blur-3xl opacity-20"
            />
            <motion.div
                animate={{
                    x: [0, -40, 0],
                    y: [0, 40, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
                className="absolute -bottom-32 -right-32 w-96 h-96 bg-accent-purple rounded-full blur-3xl opacity-20"
            />
            <motion.div
                animate={{
                    x: [0, 30, 0],
                    y: [0, -20, 0],
                }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
                className="absolute top-1/4 right-1/4 w-64 h-64 bg-accent-pink rounded-full blur-3xl opacity-10"
            />

            {/* Login Card */}
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="glass-card w-full max-w-md p-8 relative z-10"
            >
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-center mb-8"
                >
                    <motion.div
                        animate={{
                            boxShadow: [
                                '0 0 20px rgba(99, 102, 241, 0.3)',
                                '0 0 40px rgba(99, 102, 241, 0.5)',
                                '0 0 20px rgba(99, 102, 241, 0.3)',
                            ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center mb-4"
                    >
                        <Timer className="w-8 h-8 text-white" />
                    </motion.div>
                    <h1 className="text-2xl font-bold text-gradient">TimeTuner</h1>
                    <p className="text-text-muted mt-2">Smart Timetable Scheduler</p>
                </motion.div>

                {/* Error Alert */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6"
                    >
                        {error}
                    </motion.div>
                )}

                {/* Form */}
                <motion.form
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    onSubmit={handleSubmit}
                    className="space-y-5"
                >
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email address"
                            required
                            className="glass-input w-full pl-11"
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            required
                            className="glass-input w-full pl-11"
                        />
                    </div>

                    <Button type="submit" className="w-full" loading={loading} variant="glow">
                        Sign In
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </motion.form>

                {/* Demo Account */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 pt-6 border-t border-border-glass text-center"
                >
                    <p className="text-sm text-text-muted">Demo account:</p>
                    <p className="text-sm text-text-primary mt-1">
                        <span className="text-primary-400">admin@college.edu</span>
                        <span className="text-text-muted"> / </span>
                        <span className="text-primary-400">Admin@123</span>
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
}
