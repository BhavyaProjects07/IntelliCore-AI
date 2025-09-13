"use client"

import { ArrowRight, Zap, Brain, Target } from "lucide-react"
import {Link} from "react-router-dom"
const Hero = () => {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-content">
          <div className="hero-text animate-slide-up">
            <h1 className="hero-title">
              Next-Gen AI for
              <span className="gradient-text"> Intelligent Analysis</span>
            </h1>
            <p className="hero-description">
              Transform complex documents, research, and data into actionable insights with DarkCore's advanced AI
              capabilities. Experience the future of intelligent content processing.
            </p>
            <div className="hero-buttons">
              <Link to="/chat">
                <button className="btn-primary animate-glow">
                  Start Analyzing
                  <ArrowRight size={20} />
                </button>
              </Link>
              <button className="btn-secondary">Watch Demo</button>
            </div>
          </div>

          <div className="hero-visual animate-slide-right">
            <div className="ai-core animate-float">
              <div className="core-ring ring-1"></div>
              <div className="core-ring ring-2"></div>
              <div className="core-ring ring-3"></div>
              <div className="core-center">
                <Brain size={40} className="gradient-text" />
              </div>
            </div>

            <div className="floating-elements">
              <div className="element element-1">
                <Zap size={24} />
              </div>
              <div className="element element-2">
                <Target size={24} />
              </div>
              <div className="element element-3">
                <Brain size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          padding-top: 80px;
          position: relative;
        }

        .hero-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
        }

        .hero-title {
          font-size: 3.5rem;
          font-weight: 700;
          line-height: 1.2;
          margin-bottom: 1.5rem;
        }

        .hero-description {
          font-size: 1.2rem;
          color: var(--text-secondary);
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .hero-buttons {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .btn-primary {
          background: var(--gradient-primary);
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
          font-size: 1.1rem;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0, 255, 136, 0.4);
        }

        .btn-secondary {
          background: transparent;
          color: var(--text-primary);
          border: 2px solid var(--border-color);
          padding: 1rem 2rem;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 1.1rem;
        }

        .btn-secondary:hover {
          border-color: var(--accent-primary);
          color: var(--accent-primary);
          transform: translateY(-2px);
        }

        .hero-visual {
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          height: 500px;
        }

        .ai-core {
          position: relative;
          width: 200px;
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .core-ring {
          position: absolute;
          border: 2px solid var(--accent-primary);
          border-radius: 50%;
          opacity: 0.3;
        }

        .ring-1 {
          width: 100%;
          height: 100%;
          animation: spin 20s linear infinite;
        }

        .ring-2 {
          width: 150%;
          height: 150%;
          animation: spin 15s linear infinite reverse;
          border-color: var(--accent-secondary);
        }

        .ring-3 {
          width: 200%;
          height: 200%;
          animation: spin 25s linear infinite;
          border-color: var(--accent-tertiary);
        }

        .core-center {
          background: var(--bg-secondary);
          border: 2px solid var(--accent-primary);
          border-radius: 50%;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-glow);
        }

        .floating-elements {
          position: absolute;
          width: 100%;
          height: 100%;
        }

        .element {
          position: absolute;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 1rem;
          color: var(--accent-primary);
          animation: float 4s ease-in-out infinite;
        }

        .element-1 {
          top: 10%;
          right: 20%;
          animation-delay: 0s;
        }

        .element-2 {
          bottom: 20%;
          left: 10%;
          animation-delay: 1s;
        }

        .element-3 {
          top: 60%;
          right: 10%;
          animation-delay: 2s;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .hero-content {
            grid-template-columns: 1fr;
            gap: 2rem;
            text-align: center;
          }

          .hero-title {
            font-size: 2.5rem;
          }

          .hero-visual {
            height: 300px;
          }

          .ai-core {
            width: 150px;
            height: 150px;
          }
        }
      `}</style>
    </section>
  )
}

export default Hero
