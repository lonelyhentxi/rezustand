import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App';

const rootDom = document.getElementById('root');
if (rootDom) {
  const root = createRoot(rootDom);

  root.render(<App />);
}
