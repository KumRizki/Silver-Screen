import { ICONS, type IconName } from '../lib/icons';

export default function Icon({ name }: { name: IconName }) {
  return <svg className="ico" viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[name] }} />;
}
