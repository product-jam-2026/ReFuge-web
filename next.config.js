const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin(); // בלי סוגריים ובלי נתיבים

/** @type {import('next').NextConfig} */
const nextConfig = {};

module.exports = withNextIntl(nextConfig);