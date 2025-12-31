import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
    // כאן אפשר להוסיף הגדרות נוספות בעתיד אם נצטרך
};

export default withNextIntl(nextConfig);