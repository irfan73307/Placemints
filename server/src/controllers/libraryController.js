const prisma = require('../db');

// GET /api/library
async function getResources(req, res) {
  try {
    const { category, type, search } = req.query;

    let resources = await prisma.resource.findMany();

    if (search) {
      const q = search.toLowerCase();
      resources = resources.filter((r) => r.title.toLowerCase().includes(q) || r.tags.toLowerCase().includes(q));
    }

    const formattedResources = resources.map((r) => ({
      id: r.id,
      title: r.title,
      category: r.tags.split(',')[0] || 'General',
      type: r.type,
      format: r.type.includes('PDF') ? 'PDF' : 'Link',
      size: '2.4 MB',
      url: r.url,
      downloads: 1420,
      company: r.tags.split(',')[1] || 'SASTRA Placement',
    }));

    res.json({ data: formattedResources });
  } catch (err) {
    console.error('Get library resources error:', err);
    res.status(500).json({ message: 'Failed to retrieve library resources.' });
  }
}

// POST /api/library
async function createResource(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    const { title, type, url, tags } = req.body;
    const userId = req.user.id;

    if (!title || !url) {
      return res.status(400).json({ message: 'Title and URL are required.' });
    }

    const resource = await prisma.resource.create({
      data: {
        title,
        type: type || 'PDF Guide',
        url,
        tags: Array.isArray(tags) ? tags.join(',') : tags || 'General',
        uploadedBy: userId,
      },
    });

    res.status(201).json({ resource });
  } catch (err) {
    console.error('Create resource error:', err);
    res.status(500).json({ message: 'Failed to upload resource.' });
  }
}

module.exports = { getResources, createResource };
