/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://familink-og.vercel.app',
  generateRobotsTxt: true,
  exclude: ['/admin/*', '/dashboard/*', '/person/*', '/tree/*', '/join/*', '/claim/*', '/notifications/*'],
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: ['/admin', '/dashboard', '/api'] },
    ],
  },
};
