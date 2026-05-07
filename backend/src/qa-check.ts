import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function qaCheck() {
  console.log('🧪 QA Check - Full Blog Post Inventory\n');

  const posts = await prisma.blogPost.findMany({ orderBy: { slug: 'asc' } });

  console.log(`Total Posts: ${posts.length}\n`);

  // Group by status
  const byStatus = {
    published: posts.filter(p => p.status === 'published'),
    scheduled: posts.filter(p => p.status === 'scheduled'),
    draft: posts.filter(p => p.status === 'draft'),
  };

  console.log('📊 Status Breakdown:');
  console.log(`   Published (crawlable): ${byStatus.published.length}`);
  console.log(`   Scheduled: ${byStatus.scheduled.length}`);
  console.log(`   Draft: ${byStatus.draft.length}\n`);

  // List all
  console.log('📋 All Posts:');
  posts.forEach((p, i) => {
    const status = p.status === 'published' ? '✅' : p.status === 'scheduled' ? '⏳' : '🔒';
    const seoOK = p.metaTitle && p.metaDescription && p.keywords ? '✅' : '❌';
    console.log(`${i + 1}. ${status} [${seoOK}] ${p.slug}`);
    console.log(`   → ${p.title}`);
    if (p.scheduledFor) console.log(`   → Scheduled for: ${p.scheduledFor}`);
  });

  // Keyword density check
  console.log('\n🔍 SEO Metrics:');
  const avgMetaTitleLen = posts.reduce((sum, p) => sum + (p.metaTitle?.length || 0), 0) / posts.length;
  const avgMetaDescLen = posts.reduce((sum, p) => sum + (p.metaDescription?.length || 0), 0) / posts.length;
  console.log(`   Avg meta title length: ${avgMetaTitleLen.toFixed(0)}/60 chars`);
  console.log(`   Avg meta desc length: ${avgMetaDescLen.toFixed(0)}/160 chars`);
  console.log(`   Posts with keywords: ${posts.filter(p => p.keywords).length}/${posts.length}`);

  // Featured image check
  const withImages = posts.filter(p => p.featuredImage).length;
  console.log(`   Posts with featured image: ${withImages}/${posts.length}`);

  // Content check
  const withContent = posts.filter(p => p.content && p.content.length > 50).length;
  console.log(`   Posts with substantial content: ${withContent}/${posts.length}`);

  // Recommendations
  console.log('\n📝 Recommendations:');
  if (byStatus.published.length < 12) {
    console.log(`   ⚠️  Only ${byStatus.published.length}/12 posts published. Publish scheduled posts?`);
  }
  if (withImages === 0) {
    console.log(`   💡 Add featured images to all posts for social sharing`);
  }
  if (withContent < posts.length) {
    console.log(`   💡 Expand post content beyond excerpts`);
  }

  console.log('\n✨ Summary: Database is seeded and ready for testing');

  await prisma.$disconnect();
}

qaCheck().catch(e => {
  console.error('QA Check failed:', e);
  process.exit(1);
});
