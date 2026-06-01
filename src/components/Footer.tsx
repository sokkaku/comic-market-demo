import { Link } from 'react-router-dom'
import { Film, Github, Twitter, MessageCircle, Mail } from 'lucide-react'
import { motion } from 'framer-motion'

const productLinks = [
  { to: '/dashboard', label: '工作台' },
  { to: '/storyboard', label: '分镜编辑器' },
  { to: '/assets', label: '资产库' },
  { to: '/models', label: '模型中心' },
  { to: '/pricing', label: '定价方案' },
]

const resourceLinks = [
  { to: '#', label: '使用文档' },
  { to: '#', label: 'API 参考' },
  { to: '#', label: '视频教程' },
  { to: '#', label: '更新日志' },
]

const socialLinks = [
  { icon: MessageCircle, label: 'Discord', href: '#' },
  { icon: Twitter, label: 'Twitter', href: '#' },
  { icon: Github, label: 'GitHub', href: '#' },
  { icon: Mail, label: 'Email', href: '#' },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
}

export default function Footer() {
  return (
    <footer className="bg-bg-primary border-t border-border-default">
      <motion.div
        className="container-limit py-16"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Column */}
          <motion.div variants={itemVariants}>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Film className="w-6 h-6 text-accent-cyan" />
              <span className="font-display font-bold text-xl text-accent-cyan">
                漫剧AI
              </span>
            </Link>
            <p className="text-text-secondary text-sm mb-6 leading-relaxed">
              AI-Powered Comic Drama Creation
              <br />
              让 AI 赋予你的故事生命
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-9 h-9 rounded-full bg-bg-tertiary flex items-center justify-center text-text-muted hover:text-accent-cyan hover:bg-accent-cyan/10 transition-all"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Product Column */}
          <motion.div variants={itemVariants}>
            <h4 className="font-display font-semibold text-text-primary mb-4">
              产品
            </h4>
            <ul className="space-y-2.5">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-text-secondary hover:text-accent-cyan transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Resources Column */}
          <motion.div variants={itemVariants}>
            <h4 className="font-display font-semibold text-text-primary mb-4">
              资源
            </h4>
            <ul className="space-y-2.5">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-text-secondary hover:text-accent-cyan transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Connect Column */}
          <motion.div variants={itemVariants}>
            <h4 className="font-display font-semibold text-text-primary mb-4">
              联系我们
            </h4>
            <ul className="space-y-2.5">
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-text-secondary hover:text-accent-cyan transition-colors flex items-center gap-2"
                  >
                    <link.icon className="w-3.5 h-3.5" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          variants={itemVariants}
          className="mt-12 pt-6 border-t border-border-default flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <p className="text-text-muted text-xs">
            &copy; {new Date().getFullYear()} 漫剧AI. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              to="#"
              className="text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              使用条款
            </Link>
            <Link
              to="#"
              className="text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              隐私政策
            </Link>
            <button className="text-xs text-text-muted hover:text-text-secondary transition-colors">
              中文 / English
            </button>
          </div>
        </motion.div>
      </motion.div>
    </footer>
  )
}
