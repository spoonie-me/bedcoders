import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  console.log('🔍 Database Verification\n');

  // Check users
  const users = await prisma.user.findMany({ include: { profile: true, gamification: true } });
  console.log(`📝 Users: ${users.length}`);
  users.forEach(u => console.log(`   ✅ ${u.email} (${u.name})`));

  // Check blog posts
  const posts = await prisma.blogPost.findMany();
  console.log(`\n📰 Blog Posts: ${posts.length}`);
  posts.forEach((p, i) => {
    if (i < 5 || i >= posts.length - 1) {
      console.log(`   ${i + 1}. "${p.title}" [${p.status}] ${p.publishedAt ? '✅' : '⏳'}`);
    } else if (i === 5) {
      console.log(`   ...`);
    }
  });

  // SEO check
  console.log('\n🔍 SEO Data Quality:');
  const postCounts = {
    withMeta: posts.filter(p => p.metaTitle && p.metaDescription && p.keywords).length,
    published: posts.filter(p => p.status === 'published').length,
    withImages: posts.filter(p => p.featuredImage).length,
  };
  
  console.log(`   ✅ Complete SEO metadata: ${postCounts.withMeta}/${posts.length}`);
  console.log(`   ✅ Published/crawlable: ${postCounts.published}/${posts.length}`);
  console.log(`   ⚠️  With featured images: ${postCounts.withImages}/${posts.length}`);

  // Sample post details
  if (posts.length > 0) {
    const sample = posts[0];
    console.log('\n📋 Sample Post (SEO Audit):');
    console.log(`   Title: "${sample.title}"`);
    console.log(`   Slug: ${sample.slug}`);
    console.log(`   Meta Title: "${sample.metaTitle}" (${sample.metaTitle?.length}/60 chars)`);
    console.log(`   Meta Desc: "${sample.metaDescription?.substring(0, 50)}..." (${sample.metaDescription?.length}/160 chars)`);
    console.log(`   Keywords: ${sample.keywords}`);
    console.log(`   Status: ${sample.status}`);
    console.log(`   Published: ${sample.publishedAt ? '✅ Yes' : '❌ No'}`);
  }

  // Launch readiness
  console.log('\n🚀 Launch Readiness:');
  const readyForLaunch = 
    users.length > 0 && 
    posts.length >= 12 && 
    postCounts.published === posts.length &&
    postCounts.withMeta === posts.length;

  console.log(`   Database populated: ${users.length > 0 ? '✅' : '❌'}`);
  console.log(`   12+ blog posts: ${posts.length >= 12 ? '✅' : '❌'} (${posts.length} posts)`);
  console.log(`   All published: ${postCounts.published === posts.length ? '✅' : '❌'}`);
  console.log(`   SEO complete: ${postCounts.withMeta === posts.length ? '✅' : '❌'}`);
  console.log(`\n${readyForLaunch ? '✨ READY FOR LAUNCH' : '⚠️  Needs additional setup'}`);

  await prisma.$disconnect();
}

verify().catch(e => {
  console.error('Verification failed:', e);
  process.exit(1);
});
